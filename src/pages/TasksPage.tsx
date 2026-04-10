// src/pages/TasksPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { tasksApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import type { Task } from "../lib/types";

const priorityColors = {
  low: "default",
  medium: "warning",
  high: "danger",
} as const;

const statusColors = {
  pending: "warning",
  in_progress: "info",
  completed: "success",
  submitted_for_review: "default",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
} as const;

export function TasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isManagerOrAdmin = user?.role === "admin" || user?.role === "manager";

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", user?.employee_id],
    queryFn: () => tasksApi.getForEmployee(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const submitForReview = useMutation({
    mutationFn: (taskId: number) =>
      tasksApi.submitForReview(taskId, user!.employee_id, "Submitted for manager/admin review"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", user?.employee_id] }),
  });

  const markComplete = useMutation({
    mutationFn: (taskId: number) => tasksApi.complete(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", user?.employee_id] }),
  });

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <Card>
        <EmptyState
          icon="error"
          title="Failed to load tasks"
          description="There was an error loading your tasks. Please try again."
        />
      </Card>
    );
  }

  const pendingTasks = tasks?.filter((t: Task) => t.status === "pending") || [];
  const inProgressTasks = tasks?.filter((t: Task) => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter((t: Task) => ["completed", "approved"].includes(t.status)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">My Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track your assigned tasks
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={() => navigate("/tasks/assign")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-10 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">assignment_add</span>
            Assign Task
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="glass-panel border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
              <span className="material-symbols-outlined text-amber-600">pending</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pendingTasks.length}</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-blue-200/60 dark:border-blue-800/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <span className="material-symbols-outlined text-blue-600">autorenew</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{inProgressTasks.length}</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel border-green-200/60 dark:border-green-800/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedTasks.length}</p>
              <p className="text-sm text-green-600 dark:text-green-500">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks List */}
      <Card padding="none" className="glass-panel">
        <CardHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        
        {!tasks || tasks.length === 0 ? (
          <EmptyState
            icon="task"
            title="No tasks yet"
            description="You don't have any tasks assigned to you."
          />
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {tasks.map((task: Task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white">{task.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 mt-3">
                      <Badge variant={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                      <Badge variant={statusColors[task.status as keyof typeof statusColors] ?? "default"}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                  {!isManagerOrAdmin && (
                    <div className="flex flex-wrap gap-2">
                      {(task.status === "pending" || task.status === "in_progress" || task.status === "changes_requested") && (
                        <button
                          className="btn-secondary"
                          onClick={() => markComplete.mutate(task.id)}
                          disabled={markComplete.isPending}
                        >
                          Mark Complete
                        </button>
                      )}
                      {(task.status === "completed" || task.status === "changes_requested") && (
                        <button
                          className="btn-primary"
                          onClick={() => submitForReview.mutate(task.id)}
                          disabled={submitForReview.isPending}
                        >
                          Submit for Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
