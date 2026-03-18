/**
 * Dashboard Page — Landing page for ALL roles.
 * Role-aware: employees see their own stats; managers/admins see workforce + gateway.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, gatewayApi, predictionsApi, tasksApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { gatewayAdminEnabled } from "../lib/deployment";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

/* ─── Tiny Reusable Pieces ──────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  accent = "blue",
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent?: "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan";
  sub?: string;
}) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    blue:    { bg: "bg-blue-50 dark:bg-blue-900/20",     text: "text-blue-600 dark:text-blue-400",     ring: "ring-blue-200/50" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200/50" },
    amber:   { bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-600 dark:text-amber-400",   ring: "ring-amber-200/50" },
    rose:    { bg: "bg-rose-50 dark:bg-rose-900/20",     text: "text-rose-600 dark:text-rose-400",     ring: "ring-rose-200/50" },
    violet:  { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-200/50" },
    cyan:    { bg: "bg-cyan-50 dark:bg-cyan-900/20",     text: "text-cyan-600 dark:text-cyan-400",     ring: "ring-cyan-200/50" },
  };
  const c = colors[accent];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3.5">
        <div className={`h-11 w-11 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
          <span className={`material-symbols-outlined text-[22px] ${c.text}`}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, action }: { title: string; icon: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="material-symbols-outlined text-[20px] text-blue-500">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  /* ── Queries ───────────────────────────────────────── */
  const { data: overview, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => dashboardApi.getOverview().then((r) => r.data),
    enabled: isManager,
  });

  const { data: productivity } = useQuery({
    queryKey: ["team-productivity"],
    queryFn: () => dashboardApi.getTeamProductivity().then((r) => r.data),
    enabled: isManager,
  });

  const { data: burnoutAlerts } = useQuery({
    queryKey: ["burnout-alerts"],
    queryFn: () => dashboardApi.getBurnoutAlerts().then((r) => r.data),
    enabled: isManager,
  });

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", user?.employee_id],
    queryFn: () => tasksApi.getForEmployee(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: mySummary } = useQuery({
    queryKey: ["my-summary", user?.employee_id],
    queryFn: () => dashboardApi.getEmployeeSummary(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: latestPredictions } = useQuery({
    queryKey: ["latest-predictions", user?.employee_id],
    queryFn: () => predictionsApi.getLatest(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  // Admin-only: gateway stats
  const { data: connectedData } = useQuery({
    queryKey: ["admin", "connected"],
    queryFn: () => gatewayApi.getConnected().then((r) => r.data?.data),
    enabled: isAdmin && gatewayAdminEnabled,
    refetchInterval: (query) => (query.state.error ? false : 15000),
  });

  /* ── Derived ───────────────────────────────────────── */
  const tasks = Array.isArray(myTasks) ? myTasks : [];
  const pendingTasks = tasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "done");
  const connectedDevices = connectedData?.devices || [];
  const blockedMacs = connectedData?.blocked_macs || [];
  const productivityData = Array.isArray(productivity) ? productivity : [];
  const alerts: any[] = Array.isArray(burnoutAlerts) ? burnoutAlerts : [];
  const formatScore = (value: unknown, decimals = 1) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : "0.0";
  };
  const productivityChartData = productivityData.map((row: any) => ({
    employee: `#${row.employee_id}`,
    avg_productivity: Number(Number(row.avg_productivity ?? 0).toFixed(1)),
  }));
  const burnoutRisk = latestPredictions?.burnout?.risk_level || mySummary?.burnout_risk || "unknown";
  const workloadStatus = latestPredictions?.workload?.future_workload_status || "unknown";

  /* ── Refresh ───────────────────────────────────────── */
  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  /* ── Greeting ──────────────────────────────────────── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] || "there";

  if (isLoading && isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here&#39;s what&#39;s happening today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
        >
          <span className={`material-symbols-outlined text-[18px] ${refreshing ? "animate-spin" : ""}`}>refresh</span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          EMPLOYEE VIEW — My Stats + Tasks (all roles)
          ══════════════════════════════════════════════════════ */}

      {/* Personal Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon="task_alt" label="Pending Tasks" value={pendingTasks.length} accent="amber" />
        <StatCard icon="check_circle" label="Completed" value={completedTasks.length} accent="emerald" />
        <StatCard icon="assignment" label="Total Tasks" value={tasks.length} accent="blue" />
        <StatCard
          icon="trending_up"
          label="Productivity"
          value={typeof mySummary?.today_productivity === "number" ? `${Math.round(mySummary.today_productivity)}%` : "—"}
          accent="violet"
          sub={typeof mySummary?.today_hours === "number" ? `${mySummary.today_hours.toFixed(1)}h today` : undefined}
        />
        <StatCard
          icon="psychology_alt"
          label="Burnout Risk"
          value={String(burnoutRisk).toUpperCase()}
          accent={String(burnoutRisk).toLowerCase() === "high" ? "rose" : String(burnoutRisk).toLowerCase() === "medium" ? "amber" : "emerald"}
          sub={`Workload: ${workloadStatus}`}
        />
      </div>

      {/* My Tasks Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <SectionHeader
            title="My Active Tasks"
            icon="checklist"
            action={
              <Link
                to="/tasks"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            }
          />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {pendingTasks.length > 0 ? (
            pendingTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      task.status === "in_progress"
                        ? "text-blue-500"
                        : "text-slate-400"
                    }`}
                  >
                    {task.status === "in_progress" ? "pending" : "radio_button_unchecked"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                    task.status === "in_progress"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {task.status === "in_progress" ? "In Progress" : "Pending"}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600 mb-2">
                celebration
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                All caught up! No pending tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MANAGER/ADMIN VIEW — Workforce Analytics
          ══════════════════════════════════════════════════════ */}
      {isManager && (
        <>
          {/* Separator */}
          <div className="flex items-center gap-4">
            <hr className="flex-1 border-slate-200 dark:border-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Team Overview
            </span>
            <hr className="flex-1 border-slate-200 dark:border-slate-700" />
          </div>

          {/* Workforce KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="group" label="Total Employees" value={overview?.total_employees ?? "—"} accent="blue" />
            <StatCard icon="person" label="Active Today" value={overview?.active_today ?? "—"} accent="emerald" />
            <StatCard icon="hourglass_top" label="Pending Tasks" value={overview?.pending_tasks ?? "—"} accent="amber" />
            <StatCard icon="task_alt" label="Done Today" value={overview?.tasks_completed_today ?? "—"} accent="cyan" />
            <StatCard icon="warning" label="Burnout Alerts" value={alerts.length || "None"} accent={alerts.length > 0 ? "rose" : "emerald"} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Productivity Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-6">
              <SectionHeader title="Team Productivity" icon="bar_chart" />
              <div className="h-72">
                {productivityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="employee" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          borderRadius: 8,
                          color: "#f1f5f9",
                          fontSize: 13,
                        }}
                        formatter={(value: unknown) => `${formatScore(value, 1)}%`}
                      />
                      <Bar dataKey="avg_productivity" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-[32px] mr-2">show_chart</span>
                    No productivity data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Burnout Alerts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-6 flex flex-col">
              <SectionHeader title="Risk Alerts" icon="warning" />
              <div className="flex-1 overflow-auto space-y-2">
                {alerts.length > 0 ? (
                  alerts.slice(0, 6).map((alert: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border-l-[3px] ${
                        alert.risk_level === "high" || alert.risk_level === "critical"
                          ? "border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/10"
                          : alert.risk_level === "medium"
                            ? "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                            : "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {alert.employee_name || `Employee #${alert.employee_id}`}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            alert.risk_level === "high" || alert.risk_level === "critical"
                              ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                              : alert.risk_level === "medium"
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                          }`}
                        >
                          {alert.risk_level}
                        </span>
                      </div>
                      {alert.score !== undefined && (
                        <p className="text-xs text-slate-500">Score: {formatScore(alert.score, 1)}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-[36px] text-emerald-400 mb-2">verified_user</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No burnout risks detected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          ADMIN VIEW — Gateway Network
          ══════════════════════════════════════════════════════ */}
      {isAdmin && gatewayAdminEnabled && connectedDevices.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
            <SectionHeader
              title="Network Devices"
              icon="router"
              action={
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-500">{connectedDevices.filter((d: any) => d.authenticated && !d.blocked).length} online</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="text-slate-500">{blockedMacs.length} blocked</span>
                  </span>
                  <Link
                    to="/admin/devices"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Manage
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">IP</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {connectedDevices.slice(0, 5).map((d: any) => (
                  <tr key={d.mac} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{d.hostname || "Unknown"}</p>
                      <p className="text-xs text-slate-400 font-mono">{d.mac}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                      {d.full_name || d.employee_code || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{d.ip}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          d.blocked
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                            : d.authenticated
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${d.blocked ? "bg-rose-500" : d.authenticated ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {d.blocked ? "Blocked" : d.authenticated ? "Online" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && !gatewayAdminEnabled && (
        <div className="glass-panel rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/40">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Gateway admin widgets are disabled in this deployment (`VITE_ENABLE_GATEWAY_ADMIN=false`).
          </p>
        </div>
      )}
    </div>
  );
}
