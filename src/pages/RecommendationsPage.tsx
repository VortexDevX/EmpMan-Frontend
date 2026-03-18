/**
 * Burnout Alerts / Recommendations Page
 */
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, predictionsApi, employeesApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { BurnoutAlert, Prediction, Employee } from "../lib/types";

export function RecommendationsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "manager";

  const { data: burnoutAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["burnout-alerts"],
    queryFn: () => dashboardApi.getBurnoutAlerts().then((r) => r.data),
    enabled: isManager,
  });

  const { data: predictions } = useQuery({
    queryKey: ["my-predictions", user?.employee_id],
    queryFn: () =>
      predictionsApi.get(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: latestPredictions } = useQuery({
    queryKey: ["my-latest-predictions", user?.employee_id],
    queryFn: () => predictionsApi.getLatest(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.list().then((r) => r.data),
    enabled: isManager,
  });

  const getEmployeeName = (empId: number) => {
    if (!Array.isArray(employees)) return `Employee #${empId}`;
    const emp = employees.find((e: Employee) => e.id === empId);
    return emp?.full_name || `Employee #${empId}`;
  };

  const getRiskStyles = (level: string) => {
    if (level === "critical" || level === "high")
      return {
        border: "border-l-rose-500",
        bg: "bg-rose-50/50 dark:bg-rose-900/10",
        badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
        score: "text-rose-600",
      };
    if (level === "medium")
      return {
        border: "border-l-amber-500",
        bg: "bg-amber-50/50 dark:bg-amber-900/10",
        badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
        score: "text-amber-600",
      };
    return {
      border: "border-l-emerald-500",
      bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
      badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
      score: "text-emerald-600",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-amber-500">psychology</span>
          Burnout Alerts & Predictions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          AI-powered burnout detection and workforce insights
        </p>
      </div>

      {/* Burnout Alerts (Manager/Admin only) */}
      {isManager && (
        <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-rose-500">warning</span>
            Team Burnout Alerts
          </h3>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : Array.isArray(burnoutAlerts) && burnoutAlerts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {burnoutAlerts.map((alert: BurnoutAlert, i: number) => {
                const styles = getRiskStyles(alert.risk_level);
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-l-[3px] ${styles.border} ${styles.bg}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {alert.employee_name || getEmployeeName(alert.employee_id)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Employee #{alert.employee_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {alert.score !== undefined && (
                          <div className="text-right">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Risk Score</span>
                            <p className={`text-lg font-bold ${styles.score}`}>
                              {typeof alert.score === "number"
                                ? alert.score.toFixed(1)
                                : alert.score}
                            </p>
                          </div>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${styles.badge}`}>
                          {alert.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-emerald-400">check_circle</span>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">No burnout alerts — team is healthy!</p>
            </div>
          )}
        </div>
      )}

      {/* My Predictions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-blue-500">insights</span>
          {isManager ? "Your Predictions" : "My Predictions"}
        </h3>
        {latestPredictions && (
          <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {["burnout", "productivity", "workload"].map((key) => {
              const pred = latestPredictions[key as keyof typeof latestPredictions];
              const risk = pred?.risk_level || "unknown";
              const styles = getRiskStyles(risk);
              return (
                <div key={key} className={`rounded-lg border-l-[3px] p-3 ${styles.border} ${styles.bg}`}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">{key}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {pred?.score !== undefined && pred?.score !== null ? Number(pred.score).toFixed(2) : "N/A"}
                  </p>
                  <p className={`text-xs font-semibold mt-1 ${styles.score}`}>{String(risk).toUpperCase()}</p>
                </div>
              );
            })}
          </div>
        )}
        {Array.isArray(predictions) && predictions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {predictions.map((pred: Prediction) => {
              const styles = getRiskStyles(pred.risk_level);
              return (
                <div key={pred.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 capitalize">
                      {pred.prediction_type}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${styles.badge}`}>
                      {pred.risk_level}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Score</span>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {pred.score !== undefined && pred.score !== null ? Number(pred.score).toFixed(1) : "N/A"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(pred.prediction_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">insights</span>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">No predictions available</p>
          </div>
        )}
      </div>
    </div>
  );
}
