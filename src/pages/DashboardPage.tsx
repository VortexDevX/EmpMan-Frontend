import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApi, gatewayApi, predictionsApi, tasksApi } from "../lib/api";
import { gatewayAdminEnabled } from "../lib/deployment";
import { useAuth } from "../contexts/AuthContext";
import { EmployeeLink } from "../components/EmployeeLink";

function KPICard({
  label,
  value,
  icon,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: "slate" | "teal" | "amber" | "rose" | "blue";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-300",
    teal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    blue: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function score(value: unknown, decimals = 1): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.0";
  return num.toFixed(decimals);
}

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";
  const isLeadership = isAdmin || isManager;
  const showPersonalExecution = !isAdmin;

  const { data: overview, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => dashboardApi.getOverview().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: productivity } = useQuery({
    queryKey: ["team-productivity"],
    queryFn: () => dashboardApi.getTeamProductivity().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: burnoutAlerts } = useQuery({
    queryKey: ["burnout-alerts"],
    queryFn: () => dashboardApi.getBurnoutAlerts().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", user?.employee_id],
    queryFn: () => tasksApi.getForEmployee(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id && showPersonalExecution,
  });

  const { data: mySummary } = useQuery({
    queryKey: ["my-summary", user?.employee_id],
    queryFn: () => dashboardApi.getEmployeeSummary(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id && showPersonalExecution,
  });

  const { data: latestPredictions } = useQuery({
    queryKey: ["latest-predictions", user?.employee_id],
    queryFn: () => predictionsApi.getLatest(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id && showPersonalExecution,
  });

  const { data: connectedData } = useQuery({
    queryKey: ["admin", "connected"],
    queryFn: () => gatewayApi.getConnected().then((r) => r.data?.data),
    enabled: isAdmin && gatewayAdminEnabled,
    refetchInterval: (query) => (query.state.error ? false : 20000),
  });

  const tasks = Array.isArray(myTasks) ? myTasks : [];
  const pendingTasks = tasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "done");

  const teamRows = Array.isArray(productivity) ? productivity : [];
  const chartData = teamRows.map((row: any) => ({
    employee_id: row.employee_id,
    employee: `#${row.employee_id}`,
    avg_productivity: Number(Number(row.avg_productivity ?? 0).toFixed(1)),
  }));

  const alerts = Array.isArray(burnoutAlerts) ? burnoutAlerts : [];
  const connectedDevices = connectedData?.devices || [];
  const blockedMacs = connectedData?.blocked_macs || [];

  const burnoutRisk = latestPredictions?.burnout?.risk_level || mySummary?.burnout_risk || "unknown";
  const workloadStatus = latestPredictions?.workload?.future_workload_status || "unknown";

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  if (isLoading && isLeadership) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {showPersonalExecution && (
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
                pendingTasks.slice(0, 5).map((task: any) => (
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
      )}

      {isLeadership && (
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
      )}

      {isAdmin && gatewayAdminEnabled && (
        <div className="surface-card p-6">
          <SectionTitle title="Gateway Live Status" subtitle="Network layer status from Pi Gateway." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard label="Connected Devices" value={connectedDevices.length} icon="router" tone="blue" />
            <KPICard
              label="Authenticated Online"
              value={connectedDevices.filter((d: any) => d.authenticated && !d.blocked).length}
              icon="wifi"
              tone="teal"
            />
            <KPICard label="Blocked MACs" value={blockedMacs.length} icon="block" tone="rose" />
          </div>
        </div>
      )}

      {isAdmin && !gatewayAdminEnabled && (
        <div className="glass-panel rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/40">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Gateway widgets are disabled in this deployment (`VITE_ENABLE_GATEWAY_ADMIN=false`).
          </p>
        </div>
      )}

      {isEmployee && (
        <div className="surface-card p-4 text-sm text-slate-600 dark:text-slate-300">
          Tip: Use <strong>Insights</strong> for interpretation and next-step recommendations from your latest signals.
        </div>
      )}
    </div>
  );
}
