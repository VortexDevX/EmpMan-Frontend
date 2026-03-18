// src/pages/admin/EmployeesPage.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/api";
import { EmployeeLink } from "../../components/EmployeeLink";

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  department?: string;
  last_login?: string;
}

export function AdminEmployeesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: employees = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "employees", showInactive],
    queryFn: async () => {
      const res = await adminApi.listEmployees();
      const payload = res.data;
      // Support both direct array and wrapped API payloads.
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.employees)) return payload.employees;
      if (Array.isArray(payload?.data?.employees)) return payload.data.employees;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });

  const errorStatus = (error as { response?: { status?: number } })?.response?.status;
  const errorDetail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;

  const filteredEmployees = (Array.isArray(employees) ? employees : []).filter((e: Employee) => {
    if (!showInactive && !e.is_active) return false;
    const q = searchQuery.toLowerCase();
    return (
      e.employee_code.toLowerCase().includes(q) ||
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: (Array.isArray(employees) ? employees : []).length,
    active: (Array.isArray(employees) ? employees : []).filter((e: Employee) => e.is_active).length,
    inactive: (Array.isArray(employees) ? employees : []).filter((e: Employee) => !e.is_active).length,
  };

  const roleBadge = (role: string) => {
    if (role === "admin")
      return "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400";
    if (role === "manager")
      return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400";
    return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
  };

  const invalidateEmployees = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });

  const toggleActiveMutation = useMutation({
    mutationFn: async (emp: Employee) => {
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

  if (isError) {
    const is403 = errorStatus === 403;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-blue-500">group</span>
            Employee Management
          </h1>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-6 flex gap-4">
          <span className="material-symbols-outlined text-[28px] text-rose-500 shrink-0 mt-0.5">lock</span>
          <div>
            <h3 className="font-semibold text-rose-700 dark:text-rose-400">
              {is403 ? "Access Denied — Insufficient Role" : "Failed to Load Employees"}
            </h3>
            <p className="text-sm text-rose-600 dark:text-rose-500 mt-1">
              {is403
                ? errorDetail || "The server requires your account to have Admin, Manager, or Gateway role to list employees. Log out and sign in with an admin/manager account."
                : errorDetail || "An unexpected error occurred. Please try again."}
            </p>
            {is403 && (
              <p className="text-xs text-rose-500 dark:text-rose-600 mt-2">
                Error {errorStatus}: {errorDetail}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 section-title">
            <span className="material-symbols-outlined text-[24px] text-blue-500">group</span>
            Employee Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage employee accounts and access permissions.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/employees/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-10 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Create Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, icon: "group", colorBg: "bg-blue-50 dark:bg-blue-900/20", colorText: "text-blue-600 dark:text-blue-400" },
          { label: "Active", value: stats.active, icon: "check_circle", colorBg: "bg-emerald-50 dark:bg-emerald-900/20", colorText: "text-emerald-600 dark:text-emerald-400" },
          { label: "Inactive", value: stats.inactive, icon: "person_off", colorBg: "bg-rose-50 dark:bg-rose-900/20", colorText: "text-rose-600 dark:text-rose-400" },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-lg ${s.colorBg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[22px] ${s.colorText}`}>{s.icon}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg px-3">
          <span className="material-symbols-outlined text-[20px] text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search by code, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-blue-600 h-4 w-4"
          />
          Show inactive
        </label>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <>
          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {filteredEmployees.map((emp: Employee) => (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 ring-1 ring-slate-200/60 dark:ring-slate-700/60 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {emp.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <EmployeeLink employeeId={emp.id} className="text-sm font-semibold truncate block">
                        {emp.full_name}
                      </EmployeeLink>
                      <EmployeeLink employeeId={emp.id} className="text-xs text-slate-400 truncate block hover:text-cyan-600 dark:hover:text-cyan-300">
                        {emp.employee_code}
                      </EmployeeLink>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      emp.is_active
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${emp.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {emp.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{emp.email}</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleBadge(emp.role)}`}>
                    {emp.role}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Open details page"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                  <button
                    onClick={() => toggleActiveMutation.mutate(emp)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title={emp.is_active ? "Deactivate" : "Activate"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {emp.is_active ? "person_off" : "person_check"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 ring-1 ring-slate-200/60 dark:ring-slate-700/60 text-center">
                <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600 mb-2">
                  {searchQuery ? "search_off" : "group_off"}
                </span>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                  {searchQuery ? "No employees match your search" : "No employees found"}
                </p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block glass-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  {["Employee", "Email", "Role", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-800/50 ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredEmployees.map((emp: Employee) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {emp.full_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <EmployeeLink employeeId={emp.id} className="text-sm font-medium block">
                              {emp.full_name}
                            </EmployeeLink>
                            <EmployeeLink employeeId={emp.id} className="text-xs text-slate-400 block hover:text-cyan-600 dark:hover:text-cyan-300">
                              {emp.employee_code}
                            </EmployeeLink>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                        {emp.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleBadge(emp.role)}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            emp.is_active
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${emp.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {emp.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Open details page"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => toggleActiveMutation.mutate(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title={emp.is_active ? "Deactivate" : "Activate"}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {emp.is_active ? "person_off" : "person_check"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600 mb-2">
                          {searchQuery ? "search_off" : "group_off"}
                        </span>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                          {searchQuery ? "No employees match your search" : "No employees found"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* View / Actions Modal */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="surface-card w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedEmployee.full_name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedEmployee.employee_code}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
              <p><span className="font-medium">Role:</span> {selectedEmployee.role}</p>
              <p><span className="font-medium">Status:</span> {selectedEmployee.is_active ? "Active" : "Inactive"}</p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => navigate(`/employees/${selectedEmployee.id}`)}
                className="btn-secondary"
              >
                Open Details
              </button>
              <button
                onClick={() => toggleActiveMutation.mutate(selectedEmployee)}
                className="btn-secondary"
                disabled={toggleActiveMutation.isPending}
              >
                {selectedEmployee.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${selectedEmployee.full_name}? This cannot be undone.`)) {
                    deleteMutation.mutate(selectedEmployee.id);
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl px-4 h-10 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
