// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "../lib/api";
import type { AuthUser } from "../lib/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsTotpSetup: boolean;
  pendingEmployeeId: number | null;
  login: (employee_code: string, password: string, totp_code: string) => Promise<void>;
  loginWithoutTotp: (employee_code: string, password: string) => Promise<{ needsTotp: boolean; employeeId: number }>;
  logout: () => void;
  clearTotpSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: "access_token",
  USER: "auth_user",
} as const;
const APP_BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1) || ""
  : import.meta.env.BASE_URL;

function parseHashParams(hash: string): Record<string, string> {
  if (!hash || hash.length <= 1) return {};
  const hashString = hash.startsWith("#") ? hash.slice(1) : hash;
  const params: Record<string, string> = {};
  for (const pair of hashString.split("&")) {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      try {
        params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
      } catch {
        params[key] = value;
      }
    }
  }
  return params;
}

function cleanUrlHash(): void {
  if (window.location.hash) {
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, document.title, cleanUrl);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsTotpSetup, setNeedsTotpSetup] = useState(false);
  const [pendingEmployeeId, setPendingEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check for SSO token in URL hash
        const hash = window.location.hash;
        if (hash && hash.includes("token=")) {
          const params = parseHashParams(hash);
          const token = params.token;
          if (token && params.employee_id) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            const authUser: AuthUser = {
              employee_id: parseInt(params.employee_id, 10),
              employee_code: params.employee_code || "",
              role: (params.role as AuthUser["role"]) || "employee",
              full_name: params.full_name || "",
            };
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
            setUser(authUser);
            cleanUrlHash();
            setIsLoading(false);
            return;
          }
        }

        // Restore from localStorage
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch (error) {
        console.error("[Auth] Init error:", error);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Standard login with TOTP (unchanged workflow)
  const login = useCallback(async (employee_code: string, password: string, totp_code: string) => {
    const employeeRes = await authApi.getEmployeeByCode(employee_code);
    const employee = employeeRes.data;
    if (!employee.is_active) {
      throw new Error("Your account is inactive.");
    }
    const loginRes = await authApi.login(employee.id, password, totp_code);
    const data = loginRes.data;
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    const authUser: AuthUser = {
      employee_id: data.employee_id,
      employee_code: data.employee_code,
      role: data.role as AuthUser["role"],
      full_name: data.full_name,
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
    setUser(authUser);
    setNeedsTotpSetup(false);
    setPendingEmployeeId(null);
  }, []);

  // Pre-login check: validate employee_code + password, detect TOTP requirement
  const loginWithoutTotp = useCallback(async (employee_code: string, password: string) => {
    const employeeRes = await authApi.getEmployeeByCode(employee_code);
    const employee = employeeRes.data;
    if (!employee.is_active) {
      throw new Error("Your account is inactive.");
    }
    // Try login with empty TOTP to trigger TOTP-not-registered error
    try {
      await authApi.login(employee.id, password, "000000");
      // If it somehow succeeds (shouldn't), proceed
      return { needsTotp: false, employeeId: employee.id };
    } catch (err: any) {
      const detail = err.response?.data?.detail || "";
      if (typeof detail === "string" && detail.includes("TOTP not registered")) {
        setNeedsTotpSetup(true);
        setPendingEmployeeId(employee.id);
        return { needsTotp: true, employeeId: employee.id };
      }
      // Re-throw non-TOTP errors (wrong password, etc.)
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    const employeeId = user?.employee_id;
    if (employeeId) {
      authApi.logout(employeeId).catch(() => null);
    }
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setNeedsTotpSetup(false);
    setPendingEmployeeId(null);
    window.location.href = `${APP_BASE_PATH}/login`;
  }, [user]);

  const clearTotpSetup = useCallback(() => {
    setNeedsTotpSetup(false);
    setPendingEmployeeId(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      needsTotpSetup,
      pendingEmployeeId,
      login,
      loginWithoutTotp,
      logout,
      clearTotpSetup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
