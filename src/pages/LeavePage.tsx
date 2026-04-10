import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export function LeavePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isLeadership = user?.role === "admin" || user?.role === "manager";
  const [leaveTypeId, setLeaveTypeId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: types = [] } = useQuery({
    queryKey: ["leave", "types"],
    queryFn: () => leaveApi.listTypes().then((r) => r.data),
  });

  const { data: balances = [] } = useQuery({
    queryKey: ["leave", "balances", user?.employee_id],
    queryFn: () => leaveApi.getBalances(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["leave", "requests", user?.employee_id, isLeadership],
    queryFn: () =>
      leaveApi.listRequests(isLeadership ? undefined : { employee_id: user!.employee_id }).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      leaveApi.createRequest({
        employee_id: user!.employee_id,
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason,
      }),
    onSuccess: () => {
      setLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["leave"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: number) => leaveApi.cancel(requestId, user!.employee_id, "Cancelled by employee"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">Leave</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Apply leave, track approval status, and monitor balances.
        </p>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Apply Leave</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
          <select
            className="input-shell"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select leave type</option>
            {(types as any[]).map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input type="date" className="input-shell" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="input-shell" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <input
            className="input-shell"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <button
            className="btn-primary"
            disabled={!leaveTypeId || !startDate || !endDate || applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            Apply Leave
          </button>
        </div>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Balances</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(balances as any[]).map((b: any) => (
            <div key={b.id} className="glass-soft p-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Type #{b.leave_type_id} ({b.leave_year})</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Allocated: {b.allocated_days} • Used: {b.used_days}
              </p>
            </div>
          ))}
          {balances.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No balances found.</p>}
        </div>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {isLeadership ? "All Leave Requests" : "My Leave Requests"}
        </h2>
        <div className="mt-3 divide-y divide-slate-200/70 dark:divide-slate-700/60">
          {(requests as any[]).map((r: any) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Employee #{r.employee_id} • {String(r.start_date).slice(0, 10)} to {String(r.end_date).slice(0, 10)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {r.reason || "No reason"} • {r.status}
                </p>
              </div>
              {!isLeadership && r.status === "pending" && (
                <button
                  className="btn-secondary"
                  onClick={() => cancelMutation.mutate(r.id)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
          {requests.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No requests found.</p>}
        </div>
      </div>
    </div>
  );
}
