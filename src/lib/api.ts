// src/lib/api.ts

import axios from "axios";
import type {
  CreateProfileRequest,
  UpdateProfileRequest,
  SubmitSurveyRequest,
  RegisterDeviceRequest,
  CreateTaskRequest,
  CreateEmployeeRequest,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://manan.digimeck.in";
const WEB_API_KEY = import.meta.env.VITE_WEB_API_KEY || "";
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || "";
const GATEWAY_API_URL = import.meta.env.VITE_GATEWAY_API_URL || "";
const GATEWAY_WITH_CREDENTIALS = import.meta.env.VITE_GATEWAY_WITH_CREDENTIALS !== "false";
const APP_BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1) || ""
  : import.meta.env.BASE_URL;

if (import.meta.env.DEV) {
  console.log("[API] Base URL:", API_BASE_URL);
  console.log("[API] API Key configured:", !!WEB_API_KEY);
  console.log("[API] Gateway URL:", GATEWAY_API_URL || "(same-origin)");
}

// ── Remote API (workforce management server) ─────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(WEB_API_KEY ? { "X-API-Key": WEB_API_KEY } : {}),
  },
  timeout: 30000,
});

// Attach bearer token from localStorage when available
api.interceptors.request.use((config) => {
  const url = config.url;
  if (typeof url === "string") {
    let normalized = url;

    // Support legacy callers that still pass "api/..." (without leading slash)
    if (normalized.startsWith("api/")) {
      normalized = `/${normalized}`;
    }

    // Normalize old "/api/*" routes to "/api/v1/*"
    if (normalized === "/api") {
      normalized = "/api/v1";
    } else if (normalized.startsWith("/api/") && !normalized.startsWith("/api/v1/")) {
      normalized = normalized.replace(/^\/api\//, "/api/v1/");
    }

    config.url = normalized;
  }

  // For privileged employee-management routes, use ADMIN API key when
  // logged in as admin/manager. Backend role checks are key-based.
  try {
    const userRaw = localStorage.getItem("auth_user");
    const user = userRaw ? JSON.parse(userRaw) as { role?: string } : null;
    const isPrivilegedUser = user?.role === "admin" || user?.role === "manager";
    const url = String(config.url || "");
    const isEmployeeMgmtRoute =
      url.startsWith("/api/v1/employees") ||
      url.startsWith("/api/v1/devices/employee/");

    if (isPrivilegedUser && isEmployeeMgmtRoute && ADMIN_API_KEY) {
      config.headers["X-API-Key"] = ADMIN_API_KEY;
    }
  } catch {
    // Ignore localStorage parse errors and keep default key.
  }

  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const isAuthCall = url.includes("/auth/") || url.includes("/employees/by-code");
    const isOnLoginPage = window.location.pathname.includes("/login");

    if (status === 401 && !isAuthCall && !isOnLoginPage) {
      console.warn("[API] Unauthorized - redirecting to login");
      localStorage.removeItem("access_token");
      localStorage.removeItem("auth_user");
      window.location.href = `${APP_BASE_PATH}/login`;
    }
    
    return Promise.reject(error);
  },
);

// ── Local Flask API (same origin — auth, captive portal, gateway) ──
export const localApi = axios.create({
  ...(GATEWAY_API_URL ? { baseURL: GATEWAY_API_URL } : {}),
  headers: { "Content-Type": "application/json" },
  withCredentials: GATEWAY_WITH_CREDENTIALS,
  timeout: 15000,
});

// ─── Auth API ────────────────────────────────────────────────
export const authApi = {
  /**
   * Get employee by code - returns employee object with id
   */
  getEmployeeByCode: (employee_code: string) =>
    api.get<{
      id: number;
      employee_code: string;
      full_name: string;
      role: string;
      is_active: boolean;
    }>(`/api/v1/employees/by-code/${employee_code}`),

  /**
   * Login with employee_id + password + totp_code (all required)
   * Returns JWT token
   */
  login: (employee_id: number, password: string, totp_code: string) =>
    api.post<{
      access_token: string;
      token_type: string;
      employee_id: number;
      employee_code: string;
      role: string;
      full_name: string;
    }>("/api/v1/auth/login", {
      employee_id,
      password,
      totp_code,
    }),

  /**
   * Verify TOTP only (for checking if TOTP is set up)
   */
  verify: (employee_id: number, totp_code: string) =>
    api.post("/api/v1/auth/verify", {
      employee_id,
      totp_code,
    }),

  /**
   * Register TOTP - generates QR code
   */
  register: (employee_id: number) =>
    api.post<{
      employee_id: number;
      employee_code: string;
      totp_secret: string;
      qr_code_url: string;
      message: string;
    }>("/api/v1/auth/register", {
      employee_id,
    }),

  /**
   * Logout - marks session as inactive
   */
  logout: (employee_id?: number) =>
    api.post("/api/v1/auth/logout", employee_id ? { employee_id } : {}),

  /**
   * Change password
   */
  changePassword: (employee_id: number, current_password: string, new_password: string) =>
    api.post("/api/v1/auth/change-password", {
      employee_id,
      current_password,
      new_password,
    }),
};

// ─── Gateway Device Management (local Flask) ─────────────────
export const gatewayApi = {
  getConnected: () => localApi.get("/admin/api/connected"),
  getStats: () => localApi.get("/admin/api/stats"),
  disconnect: (mac: string, employee_id?: number) =>
    localApi.post("/admin/api/disconnect", { mac, employee_id }),
  block: (mac: string) => localApi.post("/admin/api/block", { mac }),
  unblock: (mac: string) => localApi.post("/admin/api/unblock", { mac }),
  kickAll: () => localApi.post("/admin/api/kick-all"),
  getLogs: (lines?: number) =>
    localApi.get(`/admin/api/logs?lines=${lines || 200}`),
  deleteDevice: (deviceId: number) =>
    localApi.delete(`/admin/api/devices/${deviceId}/delete`),
  // Employee-specific detail views can come from the remote Employee API.
  getEmployeeSessions: (employeeId: number) =>
    api.get(`/api/v1/telemetry/sessions/employee/${employeeId}`),
  getEmployeeDevices: (employeeId: number) =>
    api.get(`/api/v1/devices/employee/${employeeId}`),
  getHealth: () => localApi.get("/admin/api/health"),
};

// ─── Status (local Flask) ────────────────────────────────────
export const statusApi = {
  get: () => localApi.get("/status"),
};

// ─── Employees (remote API) ──────────────────────────────────
export const employeesApi = {
  list: () => api.get("/api/v1/employees/"),
  get: (id: number) => api.get(`/api/v1/employees/${id}`),
  getByCode: (code: string) => api.get(`/api/v1/employees/by-code/${code}`),
  create: (data: CreateEmployeeRequest) => api.post("/api/v1/employees/", data),
  getProfile: (id: number) => api.get(`/api/v1/employees/${id}/profile`),
  createProfile: (id: number, data: CreateProfileRequest) =>
    api.post(`/api/v1/employees/${id}/profile`, data),
  updateProfile: (id: number, data: UpdateProfileRequest) =>
    api.put(`/api/v1/employees/${id}/profile`, data),
};

// ─── Departments (remote API) ────────────────────────────────
export const departmentsApi = {
  list: () => api.get("/api/v1/departments/"),
};

// ─── Tasks (remote API) ──────────────────────────────────────
export const tasksApi = {
  getForEmployee: (employeeId: number) =>
    api.get(`/api/v1/tasks/employee/${employeeId}`),
  getAll: () => api.get("/api/v1/tasks/"),
  get: (taskId: number) => api.get(`/api/v1/tasks/${taskId}`),
  create: (data: CreateTaskRequest) => {
    const { assigned_by, ...taskData } = data;
    return api.post("/api/v1/tasks/", taskData, {
      params: { assigned_by },
    });
  },
  updateStatus: (taskId: number, status: string) =>
    api.put(`/api/v1/tasks/${taskId}`, { status }),
  complete: (taskId: number) => api.post(`/api/v1/tasks/${taskId}/complete`),
  getComments: (taskId: number) =>
    api.get(`/api/v1/tasks/${taskId}/comments`),
  addComment: (taskId: number, authorId: number, message: string) =>
    api.post(`/api/v1/tasks/${taskId}/comments?author_id=${authorId}`, {
      message,
    }),
};

// ─── Admin API (Pi-Gateway local) ────────────────────────────
export const adminApi = {
  // Employee-management actions are served by the remote Employee API.
  listEmployees: () => api.get("/api/v1/employees/"),
  getEmployee: (id: number) => api.get(`/api/v1/employees/${id}`),
  getEmployeeDevices: (id: number) => api.get(`/api/v1/devices/employee/${id}`),
  blockEmployee: (id: number, reason?: string) =>
    api.post(`/api/v1/employees/${id}/deactivate`, null, {
      params: reason ? { reason } : undefined,
    }),
  unblockEmployee: (id: number) =>
    api.post(`/api/v1/employees/${id}/activate`),
  deleteEmployee: (id: number) =>
    api.delete(`/api/v1/employees/${id}`),
  // Gateway runtime actions remain on local gateway API.
  getConnected: () => localApi.get("/admin/api/connected"),
  getStats: () => localApi.get("/admin/api/stats"),
  disconnect: (mac: string, employeeId?: number) =>
    localApi.post("/admin/api/disconnect", { mac, employee_id: employeeId }),
  block: (mac: string) => localApi.post("/admin/api/block", { mac }),
  unblock: (mac: string) => localApi.post("/admin/api/unblock", { mac }),
  kickAll: () => localApi.post("/admin/api/kick-all"),
  getLogs: (lines?: number) => localApi.get(`/admin/api/logs?lines=${lines || 200}`),
  getHealth: () => localApi.get("/admin/api/health"),
};

// ─── Surveys (remote API) ────────────────────────────────────
export const surveysApi = {
  submit: (employeeId: number, data: SubmitSurveyRequest) =>
    api.post(`/api/v1/surveys/${employeeId}`, data),
  get: (employeeId: number) => api.get(`/api/v1/surveys/${employeeId}`),
};

// ─── Dashboard (remote API) ──────────────────────────────────
export const dashboardApi = {
  getOverview: () => api.get("/api/v1/dashboard/overview"),
  getTeamProductivity: () => api.get("/api/v1/dashboard/team-productivity"),
  getBurnoutAlerts: () => api.get("/api/v1/dashboard/burnout-alerts"),
  getEmployeeSummary: (id: number) =>
    api.get(`/api/v1/dashboard/employee/${id}/summary`),
};

// ─── Holidays (remote API) ───────────────────────────────────
export const holidaysApi = {
  list: () => api.get("/api/v1/holidays/"),
};

// ─── Devices (remote API) ────────────────────────────────────
export const devicesApi = {
  getForEmployee: (employeeId: number) =>
    api.get(`/api/v1/devices/employee/${employeeId}`),
  register: (data: RegisterDeviceRequest) =>
    api.post("/api/v1/devices/", data),
  block: (deviceId: number, reason?: string) =>
    api.post(
      `/api/v1/devices/${deviceId}/block${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
    ),
  unblock: (deviceId: number) =>
    api.post(`/api/v1/devices/${deviceId}/unblock`),
};

// ─── ML / Predictions (remote API) ───────────────────────────
export const predictionsApi = {
  get: (employeeId: number) =>
    api.get(`/api/v1/ml/predictions/${employeeId}`),
  getLatest: (employeeId: number) =>
    api.get(`/api/v1/ml/predictions/latest/${employeeId}`),
};

// ─── Health (remote API) ─────────────────────────────────────
export const healthApi = {
  check: () => api.get("/health"),
};

export default api;
