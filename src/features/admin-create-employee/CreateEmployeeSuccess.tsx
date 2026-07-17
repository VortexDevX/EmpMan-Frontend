import type { CreateEmployeeFormState } from "./types";

type Props = Pick<CreateEmployeeFormState, "createdCredentials" | "handleCopyCredentials" | "goToEmployees">;

export function CreateEmployeeSuccess({ createdCredentials, handleCopyCredentials, goToEmployees }: Props) {
  if (!createdCredentials) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employee Created</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Share these credentials with the employee</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden max-w-lg">
        <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-semibold">Account created successfully!</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Name</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{createdCredentials.full_name}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Employee Code</span>
              <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">{createdCredentials.employee_code}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Password</span>
              <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">{createdCredentials.password}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">info</span>
            <span>The employee will be required to set up two-factor authentication (TOTP) on their first login.</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyCredentials}
              className="btn-primary h-10"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copy Credentials
            </button>
            <button
              onClick={goToEmployees}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-slate-400 transition-colors flex items-center gap-2"
            >
              View All Employees
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
