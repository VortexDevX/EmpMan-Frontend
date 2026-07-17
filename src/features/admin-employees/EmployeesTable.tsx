import type { NavigateFunction } from "react-router-dom";
import { EmployeeLink } from "../../components/EmployeeLink";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { AdminEmployee } from "./types";

interface Props {
  filteredEmployees: AdminEmployee[];
  searchQuery: string;
  navigate: NavigateFunction;
  roleBadge: (role: string) => string;
  onToggleActive: (employee: AdminEmployee) => void;
  canManage: boolean;
}

export function EmployeesTable({
  filteredEmployees,
  searchQuery,
  navigate,
  roleBadge,
  onToggleActive,
  canManage,
}: Props) {
  return (
    <>
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="surface-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
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
              <StatusBadge tone={emp.is_active ? "success" : "danger"}>
                {emp.is_active ? "Active" : "Inactive"}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{emp.email}</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleBadge(emp.role)}`}>
                {emp.role}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              {canManage && <button
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="p-2 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                title="Open details page"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>}
              <button
                onClick={() => onToggleActive(emp)}
                className="p-2 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
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
          <div className="surface-card p-8 text-center">
            <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600 mb-2">
              {searchQuery ? "search_off" : "group_off"}
            </span>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              {searchQuery ? "No employees match your search" : "No employees found"}
            </p>
          </div>
        )}
      </div>

      <div className="hidden md:block surface-card overflow-hidden">
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
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
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
                    <StatusBadge tone={emp.is_active ? "success" : "danger"}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && <button
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="Open details page"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>}
                      <button
                        onClick={() => onToggleActive(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
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
  );
}
