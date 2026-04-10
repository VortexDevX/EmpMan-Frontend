import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalsApi, leaveApi, tasksApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export function ApprovalInboxPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reviewerId = user?.employee_id || 0;

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () => approvalsApi.listPending().then((r) => r.data),
  });

  const leaveApprove = useMutation({
    mutationFn: (requestId: number) => leaveApi.approve(requestId, reviewerId, "Approved from inbox"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });
  const leaveReject = useMutation({
    mutationFn: (requestId: number) => leaveApi.reject(requestId, reviewerId, "Rejected from inbox"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });
  const taskApprove = useMutation({
    mutationFn: (taskId: number) => tasksApi.review(taskId, reviewerId, "approved", "Approved from inbox"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });
  const taskChanges = useMutation({
    mutationFn: (taskId: number) => tasksApi.review(taskId, reviewerId, "changes_requested", "Please revise and resubmit"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });
  const taskReject = useMutation({
    mutationFn: (taskId: number) => tasksApi.review(taskId, reviewerId, "rejected", "Rejected in review"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">Approval Inbox</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unified queue for leave approvals and task review decisions.
        </p>
      </div>

      <div className="surface-card p-5">
        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-cyan-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {(approvals as any[]).map((a: any) => (
              <div key={`${a.approval_type}-${a.reference_id}`} className="glass-soft p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {a.approval_type === "leave" ? "Leave Request" : "Task Review"} • {a.full_name || `Employee #${a.employee_id}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {a.summary} • submitted {new Date(a.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="chip">{a.status}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {a.approval_type === "leave" ? (
                    <>
                      <button className="btn-primary" onClick={() => leaveApprove.mutate(a.reference_id)}>Approve</button>
                      <button className="btn-secondary" onClick={() => leaveReject.mutate(a.reference_id)}>Reject</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-primary" onClick={() => taskApprove.mutate(a.reference_id)}>Approve</button>
                      <button className="btn-secondary" onClick={() => taskChanges.mutate(a.reference_id)}>Request Changes</button>
                      <button className="btn-secondary" onClick={() => taskReject.mutate(a.reference_id)}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(approvals as any[]).length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No pending approvals.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

