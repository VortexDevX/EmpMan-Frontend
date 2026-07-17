// src/lib/api.ts

import axios from "axios";
import type {
  CreateProfileRequest,
  UpdateProfileRequest,
  SubmitSurveyRequest,
  RegisterDeviceRequest,
  CreateTaskRequest,
  CreateEmployeeRequest,
  AttendanceRecord,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  PendingApproval,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://emp-manan.mvlab.cloud";
const GATEWAY_API_URL = import.meta.env.VITE_GATEWAY_API_URL || "";
const GATEWAY_WITH_CREDENTIALS = import.meta.env.VITE_GATEWAY_WITH_CREDENTIALS !== "false";
const APP_BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1) || ""
  : import.meta.env.BASE_URL;

if (import.meta.env.DEV) {
  console.log("[API] Base URL:", API_BASE_URL);
  console.log("[API] Gateway URL:", GATEWAY_API_URL || "(same-origin)");
}

// ── Remote API (workforce management server) ─────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
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

let gatewayCsrfToken: string | null = null;
let gatewayCsrfRequest: Promise<string> | null = null;

async function getGatewayCsrfToken(): Promise<string> {
  if (gatewayCsrfToken) return gatewayCsrfToken;

  if (!gatewayCsrfRequest) {
    const csrfUrl = `${GATEWAY_API_URL}/api/v1/auth/csrf`;
    gatewayCsrfRequest = axios
      .get<{ csrf_token: string }>(csrfUrl, {
        withCredentials: GATEWAY_WITH_CREDENTIALS,
        timeout: 15000,
      })
      .then(({ data }) => {
        if (!data.csrf_token) throw new Error("Gateway returned an empty CSRF token");
        gatewayCsrfToken = data.csrf_token;
        return data.csrf_token;
      })
      .finally(() => {
        gatewayCsrfRequest = null;
      });
  }

  return gatewayCsrfRequest;
}

localApi.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (method && ["post", "put", "patch", "delete"].includes(method)) {
    config.headers.set("X-CSRFToken", await getGatewayCsrfToken());
  }
  return config;
});

localApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 400 &&
      String(error.response?.data || "").includes("CSRF")
    ) {
      gatewayCsrfToken = null;
    }
    return Promise.reject(error);
  },
);

// ─── Auth API ────────────────────────────────────────────────
export const authApi = {
  exchange: (code: string) =>
    api.post<{
      access_token: string;
      token_type: string;
      employee_id: number;
      employee_code: string;
      role: string;
      full_name: string;
    }>("/api/v1/auth/exchange", { code }),

  preflight: (employee_code: string, password: string) =>
    api.post<{
      employee_id: number;
      employee_code: string;
      totp_required: boolean;
      setup_token?: string;
    }>("/api/v1/auth/preflight", { employee_code, password }),

  /**
   * Login with employee_id + password + totp_code (all required)
   * Returns JWT token
   */
  login: (employee_code: string, password: string, totp_code: string) =>
    api.post<{
      access_token: string;
      token_type: string;
      employee_id: number;
      employee_code: string;
      role: string;
      full_name: string;
    }>("/api/v1/auth/login", {
      employee_code,
      password,
      totp_code,
    }),

  /**
   * Verify TOTP only (for checking if TOTP is set up)
   */
  /**
   * Register TOTP - generates QR code
   */
  register: (setup_token: string) =>
    api.post<{
      employee_id: number;
      employee_code: string;
      totp_secret: string;
      qr_code_url: string;
      confirmation_token: string;
      message: string;
    }>("/api/v1/auth/register", {
      setup_token,
    }),

  confirmTotp: (confirmation_token: string, totp_code: string) =>
    api.post("/api/v1/auth/confirm-totp", { confirmation_token, totp_code }),

  /**
   * Logout - marks session as inactive
   */
  logout: () => api.post("/api/v1/auth/logout"),

  /**
   * Change password
   */
  changePassword: (current_password: string, new_password: string) =>
    api.post("/api/v1/auth/change-password", {
      current_password,
      new_password,
    }),

  resetPassword: (token_id: string, token: string, new_password: string) =>
    api.post("/api/v1/auth/reset-password", { token_id, token, new_password }),
};

const gatewayRuntimeApi = {
  getConnected: () => localApi.get("/admin/api/connected"),
  getStats: () => localApi.get("/admin/api/stats"),
  disconnect: (mac: string, employeeId?: number) =>
    localApi.post("/admin/api/disconnect", { mac, employee_id: employeeId }),
  block: (mac: string) => localApi.post("/admin/api/block", { mac }),
  unblock: (mac: string) => localApi.post("/admin/api/unblock", { mac }),
  kickAll: () => localApi.post("/admin/api/kick-all"),
  getLogs: (lines?: number) =>
    localApi.get(`/admin/api/logs?lines=${lines || 200}`),
  getHealth: () => localApi.get("/admin/api/health"),
};

// ─── Gateway Device Management (local Flask) ─────────────────
export const gatewayApi = {
  ...gatewayRuntimeApi,
  deleteDevice: (deviceId: number) =>
    localApi.delete(`/admin/api/devices/${deviceId}/delete`),
  // Employee-specific detail views can come from the remote Employee API.
  getEmployeeSessions: (employeeId: number) =>
    api.get(`/api/v1/telemetry/sessions/employee/${employeeId}`),
  getEmployeeDevices: (employeeId: number) =>
    api.get(`/api/v1/devices/employee/${employeeId}`),
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
  create: (data: CreateTaskRequest) => api.post("/api/v1/tasks/", data),
  updateStatus: (taskId: number, status: string) =>
    api.put(`/api/v1/tasks/${taskId}`, { status }),
  complete: (taskId: number) => api.post(`/api/v1/tasks/${taskId}/complete`),
  submitForReview: (taskId: number, _submittedBy: number, review_note?: string, evidence_refs?: unknown[]) =>
    api.post(`/api/v1/tasks/${taskId}/submit-review`, { review_note, evidence_refs }),
  review: (taskId: number, _reviewerId: number, decision: "approved" | "rejected" | "changes_requested", review_note?: string) =>
    api.post(`/api/v1/tasks/${taskId}/review`, { decision, review_note }),
  getComments: (taskId: number) =>
    api.get(`/api/v1/tasks/${taskId}/comments`),
  addComment: (taskId: number, _authorId: number, message: string) =>
    api.post(`/api/v1/tasks/${taskId}/comments`, {
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
  ...gatewayRuntimeApi,
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

// ─── Attendance (remote API) ─────────────────────────────────
export const attendanceApi = {
  checkIn: (employee_id: number, notes?: string) =>
    api.post<AttendanceRecord>("/api/v1/attendance/check-in", { employee_id, notes }),
  checkOut: (employee_id: number, notes?: string) =>
    api.post<AttendanceRecord>("/api/v1/attendance/check-out", { employee_id, notes }),
  getForEmployee: (employeeId: number, from_date?: string, to_date?: string) =>
    api.get<AttendanceRecord[]>(`/api/v1/attendance/employee/${employeeId}`, { params: { from_date, to_date } }),
  getTeamForDate: (work_date?: string) =>
    api.get<AttendanceRecord[]>("/api/v1/attendance/team", { params: { work_date } }),
};

// ─── Leave (remote API) ──────────────────────────────────────
export const leaveApi = {
  listTypes: () => api.get<LeaveType[]>("/api/v1/leave/types"),
  getBalances: (employeeId: number, year?: number) =>
    api.get<LeaveBalance[]>(`/api/v1/leave/balances/${employeeId}`, { params: { year } }),
  listRequests: (params?: { employee_id?: number; status?: string }) =>
    api.get<LeaveRequest[]>("/api/v1/leave/requests", { params }),
  createRequest: (data: {
    employee_id: number;
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason?: string;
    handover_note?: string;
  }) => api.post<LeaveRequest>("/api/v1/leave/requests", data),
  approve: (requestId: number, _decidedBy: number, decision_note?: string) =>
    api.post<LeaveRequest>(`/api/v1/leave/requests/${requestId}/approve`, { decision_note }),
  reject: (requestId: number, _decidedBy: number, decision_note?: string) =>
    api.post<LeaveRequest>(`/api/v1/leave/requests/${requestId}/reject`, { decision_note }),
  cancel: (requestId: number, _cancelledBy: number, reason?: string) =>
    api.post<LeaveRequest>(`/api/v1/leave/requests/${requestId}/cancel`, { reason }),
};

// ─── Approvals (remote API) ──────────────────────────────────
export const approvalsApi = {
  listPending: () => api.get<PendingApproval[]>("/api/v1/approvals/pending"),
};

// ─── Health (remote API) ─────────────────────────────────────
export const healthApi = {
  check: () => api.get("/api/v1/health"),
};

export default api;
