import type { NavigateFunction } from "react-router-dom";
import type { AdminEmployee } from "./types";

export function EmployeeActionsModal({
  employee,
  onClose,
  navigate,
  onToggleActive,
  onDelete,
  togglePending,
  deletePending,
}: {
  employee: AdminEmployee | null;
  onClose: () => void;
  navigate: NavigateFunction;
  onToggleActive: (employee: AdminEmployee) => void;
  onDelete: (id: number) => void;
  togglePending: boolean;
  deletePending: boolean;
}) {
  if (!employee) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="surface-card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {employee.full_name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {employee.employee_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p><span className="font-medium">Email:</span> {employee.email}</p>
          <p><span className="font-medium">Role:</span> {employee.role}</p>
          <p><span className="font-medium">Status:</span> {employee.is_active ? "Active" : "Inactive"}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/employees/${employee.id}`)}
            className="btn-secondary"
          >
            Open Details
          </button>
          <button
            onClick={() => onToggleActive(employee)}
            className="btn-secondary"
            disabled={togglePending}
          >
            {employee.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete ${employee.full_name}? This cannot be undone.`)) {
                onDelete(employee.id);
              }
            }}
            className="inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
            disabled={deletePending}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
