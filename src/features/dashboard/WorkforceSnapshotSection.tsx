import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmployeeLink } from "../../components/EmployeeLink";
import { KPICard, SectionTitle, score } from "./DashboardPrimitives";

export function WorkforceSnapshotSection({
  overview,
  alerts,
  chartData,
}: {
  overview: any;
  alerts: any[];
  chartData: any[];
}) {
  return (
    <>
      <SectionTitle
        title="Workforce Snapshot"
        subtitle="Top-level metrics to monitor daily."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Total Employees" value={overview?.total_employees ?? "—"} icon="group" tone="blue" />
        <KPICard label="Active Today" value={overview?.active_today ?? "—"} icon="person" tone="teal" />
        <KPICard label="Pending Tasks" value={overview?.pending_tasks ?? "—"} icon="hourglass_top" tone="amber" />
        <KPICard label="Completed Today" value={overview?.tasks_completed_today ?? "—"} icon="task_alt" tone="teal" />
        <KPICard label="Burnout Alerts" value={alerts.length} icon="warning" tone={alerts.length > 0 ? "rose" : "teal"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="surface-card p-6 xl:col-span-2">
          <SectionTitle title="Average Productivity by Employee" subtitle="Rounded to 1 decimal for readability." />
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                  <XAxis dataKey="employee" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip formatter={(value: unknown) => `${score(value, 1)}%`} />
                  <Bar dataKey="avg_productivity" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No productivity data available.
              </div>
            )}
          </div>
          {chartData.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {chartData.slice(0, 12).map((row: any) => (
                <EmployeeLink key={row.employee_id} employeeId={row.employee_id}>
                  Employee #{row.employee_id}: {score(row.avg_productivity, 1)}%
                </EmployeeLink>
              ))}
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <SectionTitle title="Burnout Alerts" subtitle="Employees needing review today." />
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {alerts.length > 0 ? (
              alerts.slice(0, 8).map((alert: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      <EmployeeLink employeeId={alert.employee_id}>
                        {alert.employee_name || `Employee #${alert.employee_id}`}
                      </EmployeeLink>
                    </p>
                    <span className="chip">{String(alert.risk_level || "unknown").toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Risk score: {score(alert.score, 1)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No active burnout alerts.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
