import type { NavigateFunction } from "react-router-dom";
import type { UseMutationResult } from "@tanstack/react-query";

export interface AdminEmployee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  department?: string;
  last_login?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
}

export interface AdminEmployeesState {
  canManage: boolean;
  searchQuery: string;
  showInactive: boolean;
  selectedEmployee: AdminEmployee | null;
  employees: AdminEmployee[];
  filteredEmployees: AdminEmployee[];
  stats: EmployeeStats;
  isLoading: boolean;
  isError: boolean;
  errorStatus?: number;
  errorDetail?: string;
  setSearchQuery: (value: string) => void;
  setShowInactive: (value: boolean) => void;
  setSelectedEmployee: (employee: AdminEmployee | null) => void;
  navigate: NavigateFunction;
  roleBadge: (role: string) => string;
  toggleActiveMutation: UseMutationResult<unknown, Error, AdminEmployee, unknown>;
  deleteMutation: UseMutationResult<unknown, Error, number, unknown>;
}
