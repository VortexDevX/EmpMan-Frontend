import type { NavigateFunction } from "react-router-dom";

export function EmployeesHeader({ navigate, canManage }: { navigate: NavigateFunction; canManage: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 section-title">
          <span className="material-symbols-outlined text-[24px] text-primary-600 dark:text-primary-400">group</span>
          Employee Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage employee accounts and access permissions.
        </p>
      </div>
      {canManage && <button
        onClick={() => navigate("/admin/employees/new")}
        className="btn-primary h-10 w-full sm:w-auto"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Create Employee
      </button>}
    </div>
  );
}
