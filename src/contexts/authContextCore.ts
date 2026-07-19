import { createContext } from "react";
import type { AuthUser } from "../lib/types";

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsTotpSetup: boolean;
  pendingEmployeeId: number | null;
  pendingSetupToken: string | null;
  login: (employeeCode: string, password: string, totpCode: string) => Promise<AuthUser>;
  loginWithoutTotp: (employeeCode: string, password: string) => Promise<{ needsTotp: boolean; employeeId: number }>;
  logout: () => Promise<void>;
  clearTotpSetup: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
