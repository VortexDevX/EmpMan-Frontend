export function EmployeesFilters({
  searchQuery,
  showInactive,
  setSearchQuery,
  setShowInactive,
}: {
  searchQuery: string;
  showInactive: boolean;
  setSearchQuery: (value: string) => void;
  setShowInactive: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 flex-1 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg px-3">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-slate-400">search</span>
        <label htmlFor="employee-search" className="sr-only">Search employees</label>
        <input
          id="employee-search"
          name="employee-search"
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
  );
}
