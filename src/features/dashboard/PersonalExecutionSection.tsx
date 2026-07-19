import { Link } from "react-router-dom";
import { KPICard, SectionTitle } from "./DashboardPrimitives";
import type { EmployeeSummary, Task } from "../../lib/types";

export function PersonalExecutionSection({
  isManager,
  pendingTasks,
  completedTasks,
  mySummary,
  burnoutRisk,
  workloadStatus,
}: {
  isManager: boolean;
  pendingTasks: Task[];
  completedTasks: Task[];
  mySummary: EmployeeSummary | undefined;
  burnoutRisk: string;
  workloadStatus: string;
}) {
  return (
    <>
      <SectionTitle
        title={isManager ? "Personal Execution" : "My Execution"}
        subtitle="Clear view of your workload and completion."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pending Tasks" value={pendingTasks.length} icon="task_alt" tone="amber" />
        <KPICard label="Completed" value={completedTasks.length} icon="check_circle" tone="teal" />
        <KPICard
          label="Today Productivity"
          value={typeof mySummary?.today_productivity === "number" ? `${Math.round(mySummary.today_productivity)}%` : "—"}
          icon="monitoring"
          tone="blue"
        />
        <KPICard
          label="Burnout Risk"
          value={String(burnoutRisk).toUpperCase()}
          icon="psychology"
          tone={String(burnoutRisk).toLowerCase() === "high" ? "rose" : "teal"}
          hint={`Workload: ${workloadStatus}`}
        />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Current Tasks</h3>
          <Link to="/tasks" className="text-sm font-medium text-cyan-700 dark:text-cyan-300 hover:underline">
            Open tasks page
          </Link>
        </div>
        <div className="divide-y divide-slate-200/60 dark:divide-slate-700/50">
          {pendingTasks.length > 0 ? (
            pendingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="px-6 py-3.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : "No due date"}
                  </p>
                </div>
                <span className="chip">{task.status === "in_progress" ? "In Progress" : "Pending"}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No pending tasks right now.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
