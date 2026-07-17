import type { FormEvent } from "react";

export type EmployeeRole = "employee" | "manager" | "admin";

export interface CreatedCredentials {
  employee_code: string;
  password: string;
  full_name: string;
}

export interface CreateEmployeeFormState {
  employeeCode: string;
  fullName: string;
  email: string;
  password: string;
  role: EmployeeRole;
  departmentId: number | "";
  loading: boolean;
  error: string;
  createdCredentials: CreatedCredentials | null;
  departments: unknown;
  setEmployeeCode: (value: string) => void;
  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (value: EmployeeRole) => void;
  setDepartmentId: (value: number | "") => void;
  generatePassword: () => void;
  handleSubmit: (event: FormEvent) => Promise<void>;
  handleCopyCredentials: () => void;
  goBack: () => void;
  goToEmployees: () => void;
}
