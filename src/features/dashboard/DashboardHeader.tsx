export function DashboardHeader({
  isAdmin,
  isManager,
  refreshing,
  handleRefresh,
}: {
  isAdmin: boolean;
  isManager: boolean;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">
          {isAdmin ? "Organization Dashboard" : "Dashboard"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAdmin
            ? "Live workforce metrics, productivity trends, and risk signals."
            : isManager
              ? "Your team performance and your own execution summary."
              : "Your workday progress, tasks, and wellbeing signals."}
        </p>
      </div>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="btn-secondary"
      >
        <span className={`material-symbols-outlined text-[18px] ${refreshing ? "animate-spin" : ""}`}>refresh</span>
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}
