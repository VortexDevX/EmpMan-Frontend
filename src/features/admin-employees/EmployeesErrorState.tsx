export function EmployeesErrorState({
  errorStatus,
  errorDetail,
}: {
  errorStatus?: number;
  errorDetail?: string;
}) {
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
