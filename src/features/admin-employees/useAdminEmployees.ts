import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/api";
import type { AdminEmployee } from "./types";
import { useAuth } from "../../contexts/useAuth";

function unwrapEmployees(payload: unknown): AdminEmployee[] {
  if (Array.isArray(payload)) return payload as AdminEmployee[];
  const data = payload as {
    employees?: AdminEmployee[];
    data?: AdminEmployee[] | { employees?: AdminEmployee[] };
  };
  if (Array.isArray(data?.employees)) return data.employees;
  if (Array.isArray((data?.data as { employees?: AdminEmployee[] })?.employees)) {
    return (data.data as { employees: AdminEmployee[] }).employees;
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function roleBadge(role: string) {
  if (role === "admin")
    return "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400";
  if (role === "manager")
    return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400";
  return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
}

export function useAdminEmployees() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AdminEmployee | null>(null);

  const { data: employees = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "employees", showInactive],
    queryFn: async () => {
      const res = await adminApi.listEmployees();
      return unwrapEmployees(res.data);
    },
  });

  const errorStatus = (error as { response?: { status?: number } })?.response?.status;
  const errorDetail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;

  const filteredEmployees = employees.filter((e) => {
    if (!showInactive && !e.is_active) return false;
    const q = searchQuery.toLowerCase();
    return (
      e.employee_code.toLowerCase().includes(q) ||
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.is_active).length,
    inactive: employees.filter((e) => !e.is_active).length,
  };

  const invalidateEmployees = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });

  const toggleActiveMutation = useMutation({
    mutationFn: async (emp: AdminEmployee) => {
      if (emp.is_active) return adminApi.blockEmployee(emp.id, "Deactivated from admin UI");
      return adminApi.unblockEmployee(emp.id);
    },
    onSuccess: () => {
      invalidateEmployees();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteEmployee(id),
    onSuccess: () => {
      setSelectedEmployee(null);
      invalidateEmployees();
    },
  });

  return {
    canManage,
    searchQuery,
    showInactive,
    selectedEmployee,
    employees,
    filteredEmployees,
    stats,
    isLoading,
    isError,
    errorStatus,
    errorDetail,
    setSearchQuery,
    setShowInactive,
    setSelectedEmployee,
    navigate,
    roleBadge,
    toggleActiveMutation,
    deleteMutation,
  };
}
