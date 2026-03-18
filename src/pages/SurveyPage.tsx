/**
 * Survey Page — submit weekly surveys & view history
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { surveysApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { Survey } from "../lib/types";

export function SurveyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const employeeId = user?.employee_id ?? 0;

  const [satisfaction, setSatisfaction] = useState(7);
  const [workload, setWorkload] = useState(3);
  const [balance, setBalance] = useState(3);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["surveys", employeeId],
    queryFn: () => surveysApi.get(employeeId).then((r) => r.data),
    enabled: employeeId > 0,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      surveysApi.submit(employeeId, {
        job_satisfaction_score: satisfaction,
        workload_rating: workload,
        work_life_balance: balance,
        additional_comments: comments || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["surveys", employeeId] });
      setTimeout(() => setSubmitted(false), 4000);
    },
  });

  const getRatingLabel = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) return { label: "Excellent", color: "text-emerald-600" };
    if (ratio >= 0.6) return { label: "Good", color: "text-blue-600" };
    if (ratio >= 0.4) return { label: "Average", color: "text-amber-600" };
    return { label: "Poor", color: "text-rose-600" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 section-title">
          <span className="material-symbols-outlined text-[24px] text-blue-500">rate_review</span>
          Weekly Survey
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Share your feedback to help improve the workplace
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Survey Form */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Submit Feedback</h3>

          {submitted && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Survey submitted successfully!
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Job Satisfaction (1–10) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job Satisfaction
                </label>
                <span className={`text-sm font-bold ${getRatingLabel(satisfaction, 10).color}`}>
                  {satisfaction}/10 — {getRatingLabel(satisfaction, 10).label}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={satisfaction}
                onChange={(e) => setSatisfaction(Number(e.target.value))}
                className="w-full accent-blue-600 h-2"
              />
            </div>

            {/* Workload Rating (1–5) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Workload Rating
                </label>
                <span className={`text-sm font-bold ${getRatingLabel(workload, 5).color}`}>
                  {workload}/5 — {getRatingLabel(workload, 5).label}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={workload}
                onChange={(e) => setWorkload(Number(e.target.value))}
                className="w-full accent-blue-600 h-2"
              />
            </div>

            {/* Work-Life Balance (1–5) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Work-Life Balance
                </label>
                <span className={`text-sm font-bold ${getRatingLabel(balance, 5).color}`}>
                  {balance}/5 — {getRatingLabel(balance, 5).label}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full accent-blue-600 h-2"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Additional Comments (optional)
              </label>
              <textarea
                className="w-full h-20 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-vertical"
                placeholder="Any feedback or suggestions..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium h-11 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Submit Survey
                </>
              )}
            </button>
          </div>
        </div>

        {/* Survey History */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Survey History</h3>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : Array.isArray(history) && history.length > 0 ? (
            <div className="flex flex-col gap-3">
              {history.map((survey: Survey) => (
                <div key={survey.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Satisfaction</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {survey.job_satisfaction_score}/10
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Workload</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {survey.workload_rating}/5
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Balance</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {survey.work_life_balance}/5
                      </p>
                    </div>
                  </div>
                  {survey.additional_comments && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic border-t border-slate-200 dark:border-slate-600 pt-2">
                      "{survey.additional_comments}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">
                rate_review
              </span>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">No surveys submitted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
