import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AUTH_UNAUTHORIZED_EVENT,
  authApi,
  setApiCsrfToken,
} from "../lib/api";
import type { AuthUser } from "../lib/types";
import { AuthContext } from "./authContextCore";

const STORAGE_KEYS = {
  TOTP_SETUP_TOKEN: "totp_setup_token",
  TOTP_EMPLOYEE_ID: "totp_employee_id",
} as const;

const APP_BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1) || ""
  : import.meta.env.BASE_URL;

function parseHashParams(hash: string): Record<string, string> {
  if (!hash || hash.length <= 1) return {};
  const params: Record<string, string> = {};
  for (const pair of hash.replace(/^#/, "").split("&")) {
    const [key, value] = pair.split("=");
    if (!key || value === undefined) continue;
    try {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
    } catch {
      params[key] = value;
    }
  }
  return params;
}

function clearSetupStorage(): void {
  sessionStorage.removeItem(STORAGE_KEYS.TOTP_SETUP_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOTP_EMPLOYEE_ID);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedSetupToken = sessionStorage.getItem(STORAGE_KEYS.TOTP_SETUP_TOKEN);
  const storedEmployeeId = sessionStorage.getItem(STORAGE_KEYS.TOTP_EMPLOYEE_ID);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsTotpSetup, setNeedsTotpSetup] = useState(Boolean(storedSetupToken));
  const [pendingEmployeeId, setPendingEmployeeId] = useState<number | null>(
    storedEmployeeId ? Number(storedEmployeeId) : null,
  );
  const [pendingSetupToken, setPendingSetupToken] = useState<string | null>(storedSetupToken);

  useEffect(() => {
    // Remove credentials written by versions before cookie-based authentication.
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");

    const initialize = async () => {
      try {
        const params = parseHashParams(window.location.hash);
        if (params.code) {
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
          const { data } = await authApi.exchange(params.code);
          const authUser: AuthUser = {
            employee_id: data.employee_id,
            employee_code: data.employee_code,
            role: data.role as AuthUser["role"],
            full_name: data.full_name,
          };
          setApiCsrfToken(data.csrf_token);
          setUser(authUser);
          return;
        }

        const { data } = await authApi.session();
        setApiCsrfToken(data.csrf_token);
        setUser({
          employee_id: data.employee_id,
          employee_code: data.employee_code,
          role: data.role as AuthUser["role"],
          full_name: data.full_name,
        });
      } catch {
        setApiCsrfToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void initialize();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setApiCsrfToken(null);
      setUser(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (employeeCode: string, password: string, totpCode: string) => {
    const { data } = await authApi.login(employeeCode, password, totpCode);
    const authUser: AuthUser = {
      employee_id: data.employee_id,
      employee_code: data.employee_code,
      role: data.role as AuthUser["role"],
      full_name: data.full_name,
    };
    setApiCsrfToken(data.csrf_token);
    clearSetupStorage();
    setUser(authUser);
    setNeedsTotpSetup(false);
    setPendingEmployeeId(null);
    setPendingSetupToken(null);
    return authUser;
  }, []);

  const loginWithoutTotp = useCallback(async (employeeCode: string, password: string) => {
    const { data } = await authApi.preflight(employeeCode, password);
    if (!data.totp_required) {
      if (!data.setup_token) throw new Error("TOTP setup could not be started.");
      sessionStorage.setItem(STORAGE_KEYS.TOTP_SETUP_TOKEN, data.setup_token);
      sessionStorage.setItem(STORAGE_KEYS.TOTP_EMPLOYEE_ID, String(data.employee_id));
      setPendingSetupToken(data.setup_token);
      setPendingEmployeeId(data.employee_id);
      setNeedsTotpSetup(true);
    }
    return { needsTotp: !data.totp_required, employeeId: data.employee_id };
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) await authApi.logout();
    } finally {
      setApiCsrfToken(null);
      clearSetupStorage();
      setUser(null);
      setNeedsTotpSetup(false);
      setPendingEmployeeId(null);
      setPendingSetupToken(null);
      window.location.assign(`${APP_BASE_PATH}/login`);
    }
  }, [user]);

  const clearTotpSetup = useCallback(() => {
    clearSetupStorage();
    setNeedsTotpSetup(false);
    setPendingEmployeeId(null);
    setPendingSetupToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      needsTotpSetup,
      pendingEmployeeId,
      pendingSetupToken,
      login,
      loginWithoutTotp,
      logout,
      clearTotpSetup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
