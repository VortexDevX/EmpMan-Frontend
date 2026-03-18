import { useQuery } from "@tanstack/react-query";
import { dashboardApi, predictionsApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { EmployeeLink } from "../components/EmployeeLink";

function toScore(value: unknown, decimals = 1): string {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : "0.0";
}

function AdviceCard({
  title,
  meaning,
  action,
  tone = "slate",
}: {
  title: React.ReactNode;
  meaning: string;
  action: string;
  tone?: "slate" | "teal" | "amber" | "rose";
}) {
  const toneClass: Record<string, string> = {
    slate: "border-slate-200 dark:border-slate-700",
    teal: "border-emerald-200 dark:border-emerald-800/40",
    amber: "border-amber-200 dark:border-amber-800/40",
    rose: "border-rose-200 dark:border-rose-800/40",
  };

  return (
    <div className={`surface-card p-5 border ${toneClass[tone]}`}>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
        <strong>What this means:</strong> {meaning}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        <strong>What to do:</strong> {action}
      </p>
    </div>
  );
}

export function RecommendationsPage() {
  const { user } = useAuth();
  const isLeadership = user?.role === "admin" || user?.role === "manager";

  const { data: burnoutAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["burnout-alerts"],
    queryFn: () => dashboardApi.getBurnoutAlerts().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: predictions } = useQuery({
    queryKey: ["my-predictions", user?.employee_id],
    queryFn: () => predictionsApi.get(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: latestPredictions } = useQuery({
    queryKey: ["my-latest-predictions", user?.employee_id],
    queryFn: () => predictionsApi.getLatest(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const alerts = Array.isArray(burnoutAlerts) ? burnoutAlerts : [];
  const predictionList = Array.isArray(predictions) ? predictions : [];
  const burnoutRisk = latestPredictions?.burnout?.risk_level || "unknown";
  const productivityScore = latestPredictions?.productivity?.score;
  const workloadStatus = latestPredictions?.workload?.future_workload_status || "unknown";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">
          {isLeadership ? "Team Insights" : "My Insights"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Clear interpretation of signals, with direct next actions.
        </p>
      </div>

      {isLeadership && (
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today’s Team Priorities</h2>
          {alertsLoading ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : alerts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {alerts.slice(0, 8).map((alert: any, idx: number) => {
                const risk = String(alert.risk_level || "unknown").toLowerCase();
                const tone = risk === "high" || risk === "critical" ? "rose" : risk === "medium" ? "amber" : "teal";
                const meaning =
                  tone === "rose"
                    ? "Employee may be near burnout and needs immediate intervention."
                    : tone === "amber"
                      ? "Employee shows moderate pressure signals and needs balancing support."
                      : "Signal is stable but still worth checking in.";
                const action =
                  tone === "rose"
                    ? "Do a 1:1 check-in today, reduce short-term load, and review deadlines."
                    : tone === "amber"
                      ? "Rebalance tasks this sprint and monitor next 3 days."
                      : "Keep current rhythm and run weekly check-ins.";

                return (
                  <AdviceCard
                    key={idx}
                    title={
                      <>
                        <EmployeeLink employeeId={alert.employee_id}>
                          {alert.employee_name || `Employee #${alert.employee_id}`}
                        </EmployeeLink>
                        {" • "}
                        Risk {String(alert.risk_level).toUpperCase()}
                      </>
                    }
                    meaning={`${meaning} Score ${toScore(alert.score, 1)}.`}
                    action={action}
                    tone={tone as "teal" | "amber" | "rose"}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No active team alerts today.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Burnout Risk</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{String(burnoutRisk).toUpperCase()}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Productivity</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {productivityScore !== undefined && productivityScore !== null ? `${toScore(productivityScore, 1)}%` : "N/A"}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Workload Status</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{String(workloadStatus).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdviceCard
          title="Energy & Burnout"
          meaning={`Current burnout signal is ${String(burnoutRisk).toUpperCase()}.`}
          action={
            String(burnoutRisk).toLowerCase() === "high"
              ? "Reduce context switching, finish only top-priority work, and schedule a focused recovery block."
              : "Maintain routine and add one short pause after each heavy work block."
          }
          tone={String(burnoutRisk).toLowerCase() === "high" ? "rose" : "teal"}
        />
        <AdviceCard
          title="Output & Focus"
          meaning={`Recent productivity score is ${productivityScore !== undefined && productivityScore !== null ? `${toScore(productivityScore, 1)}%` : "not available"}.`}
          action="Pick 1-2 key outcomes for today, close open loops, and defer low-impact tasks."
          tone="amber"
        />
      </div>

      <div className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Prediction History</h2>
        {predictionList.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {predictionList.slice(0, 9).map((pred: any) => (
              <div key={pred.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{pred.prediction_type}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{toScore(pred.score, 1)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {pred.prediction_date ? new Date(pred.prediction_date).toLocaleDateString() : "No date"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No prediction history available yet.</p>
        )}
      </div>
    </div>
  );
}
