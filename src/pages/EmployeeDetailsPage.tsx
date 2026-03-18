import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, devicesApi, employeesApi, predictionsApi, tasksApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function toPercent(value: unknown, decimals = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${num.toFixed(decimals)}%`;
}

export function EmployeeDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const employeeId = Number(id);
  const isValidId = Number.isFinite(employeeId) && employeeId > 0;

  const { data: employee, isLoading: employeeLoading, error: employeeError } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => employeesApi.get(employeeId).then((r) => r.data),
    enabled: isValidId,
  });

  const { data: profile } = useQuery({
    queryKey: ["employee-profile", employeeId],
    queryFn: async () => {
      try {
        const res = await employeesApi.getProfile(employeeId);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: isValidId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["employee-tasks", employeeId],
    queryFn: () => tasksApi.getForEmployee(employeeId).then((r) => r.data),
    enabled: isValidId,
  });

  const { data: summary } = useQuery({
    queryKey: ["employee-summary", employeeId],
    queryFn: () => dashboardApi.getEmployeeSummary(employeeId).then((r) => r.data),
    enabled: isValidId,
  });

  const { data: latestPredictions } = useQuery({
    queryKey: ["employee-latest-predictions", employeeId],
    queryFn: () => predictionsApi.getLatest(employeeId).then((r) => r.data),
    enabled: isValidId,
  });

  const { data: predictionHistory } = useQuery({
    queryKey: ["employee-predictions", employeeId],
    queryFn: () => predictionsApi.get(employeeId).then((r) => r.data),
    enabled: isValidId,
  });

  const { data: devices } = useQuery({
    queryKey: ["employee-devices", employeeId],
    queryFn: () => devicesApi.getForEmployee(employeeId).then((r) => r.data),
    enabled: isValidId,
  });

  const taskList = Array.isArray(tasks) ? tasks : [];
  const pendingCount = taskList.filter((t: any) => t.status === "pending" || t.status === "in_progress").length;
  const completedCount = taskList.filter((t: any) => t.status === "completed" || t.status === "done").length;
  const deviceList = Array.isArray(devices) ? devices : [];
  const predictionList = Array.isArray(predictionHistory) ? predictionHistory : [];

  const risk = String(latestPredictions?.burnout?.risk_level || summary?.burnout_risk || "unknown").toUpperCase();
  const latestProductivity = toPercent(latestPredictions?.productivity?.score ?? summary?.today_productivity);

  const canViewRestrictedData = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "manager") return true;
    return user.employee_id === employeeId;
  }, [employeeId, user]);

  if (!isValidId) {
    return (
      <div className="surface-card p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Invalid employee ID</h1>
      </div>
    );
  }

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  if (employeeError || !employee) {
    const status = (employeeError as any)?.response?.status;
    const detail = (employeeError as any)?.response?.data?.detail;
    return (
      <div className="space-y-4">
        <Link to="/admin/employees" className="text-sm text-cyan-700 dark:text-cyan-300 hover:underline inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to employees
        </Link>
        <div className="surface-card p-6 border border-rose-200/70 dark:border-rose-800/50">
          <h1 className="text-xl font-bold text-rose-700 dark:text-rose-300">Could not load employee details</h1>
          <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">
            {typeof detail === "string" ? detail : status === 403 ? "Permission denied for this employee." : "Employee not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">{employee.full_name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {employee.employee_code} • {employee.email}
          </p>
        </div>
        <Link to="/admin/employees" className="btn-secondary">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Tasks" value={pendingCount} icon="hourglass_top" />
        <StatCard label="Completed Tasks" value={completedCount} icon="task_alt" />
        <StatCard label="Productivity" value={latestProductivity} icon="monitoring" />
        <StatCard label="Burnout Risk" value={risk} icon="psychology" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-card p-5 lg:col-span-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Employee Info</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p><span className="font-medium">Role:</span> {employee.role}</p>
            <p><span className="font-medium">Status:</span> {employee.is_active ? "Active" : "Inactive"}</p>
            <p><span className="font-medium">Joined:</span> {fmtDate(profile?.joining_date || employee.created_at)}</p>
            <p><span className="font-medium">Department ID:</span> {profile?.department_id ?? "—"}</p>
            <p><span className="font-medium">Job Title:</span> {profile?.job_title || "—"}</p>
            <p><span className="font-medium">Last Login:</span> {fmtDate(employee.last_login)}</p>
          </div>
        </div>

        <div className="surface-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tasks</h2>
          {tasksLoading ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600" />
            </div>
          ) : taskList.length > 0 ? (
            <div className="mt-3 divide-y divide-slate-200/60 dark:divide-slate-700/60">
              {taskList.slice(0, 12).map((task: any) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Due {fmtDate(task.due_date)} • Priority {String(task.priority || "unknown")}
                    </p>
                  </div>
                  <span className="chip">{String(task.status || "unknown").replace("_", " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No tasks found.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Devices</h2>
          {deviceList.length > 0 ? (
            <div className="mt-3 space-y-2">
              {deviceList.slice(0, 8).map((d: any) => (
                <div key={d.id || d.mac_address} className="rounded-lg border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{d.device_name || "Device"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.mac_address || d.mac || "—"} • {d.ip_address || d.ip || "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No devices linked.</p>
          )}
        </div>

        <div className="surface-card p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Prediction History</h2>
          {canViewRestrictedData && predictionList.length > 0 ? (
            <div className="mt-3 space-y-2">
              {predictionList.slice(0, 10).map((p: any) => (
                <div key={p.id} className="rounded-lg border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{p.prediction_type}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    Score {toPercent(p.score)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {fmtDate(p.prediction_date)} • Risk {String(p.risk_level || "unknown").toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              {canViewRestrictedData ? "No prediction history available." : "Prediction data is not available for your role."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

