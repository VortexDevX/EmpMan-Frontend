import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalsApi, leaveApi, tasksApi } from "../lib/api";
import { useAuth } from "../contexts/useAuth";
import { FormAlert } from "../components/ui/FormLayout";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { getApiErrorMessage } from "../lib/errors";

export function ApprovalInboxPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reviewerId = user?.employee_id || 0;

  const { data: approvals = [], isLoading, error: loadError } = useQuery({
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
  const mutations = [leaveApprove, leaveReject, taskApprove, taskChanges, taskReject];
  const actionError = mutations.find((mutation) => mutation.error)?.error;
  const actionPending = mutations.some((mutation) => mutation.isPending);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">Approval Inbox</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unified queue for leave approvals and task review decisions.
        </p>
      </div>

      <div className="surface-card p-5">
        {loadError && (
          <FormAlert tone="error">
            {getApiErrorMessage(loadError, "Could not load the approval queue.")}
          </FormAlert>
        )}
        {actionError && (
          <FormAlert tone="error">
            {getApiErrorMessage(actionError, "The approval action could not be completed.")}
          </FormAlert>
        )}
        {isLoading ? (
          <PageLoader label="Loading approval queue" />
        ) : (
          <div className="space-y-3">
            {approvals.map((a) => (
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
                      <button type="button" className="btn-primary" disabled={actionPending} onClick={() => leaveApprove.mutate(a.reference_id)}>Approve</button>
                      <button type="button" className="btn-secondary" disabled={actionPending} onClick={() => leaveReject.mutate(a.reference_id)}>Reject</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn-primary" disabled={actionPending} onClick={() => taskApprove.mutate(a.reference_id)}>Approve</button>
                      <button type="button" className="btn-secondary" disabled={actionPending} onClick={() => taskChanges.mutate(a.reference_id)}>Request Changes</button>
                      <button type="button" className="btn-secondary" disabled={actionPending} onClick={() => taskReject.mutate(a.reference_id)}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {approvals.length === 0 && (
              <EmptyState icon="inbox" title="Queue cleared" description="There are no pending approvals." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
