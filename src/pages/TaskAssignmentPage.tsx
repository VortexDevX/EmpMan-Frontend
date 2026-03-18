// src/pages/TaskAssignmentPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { tasksApi, employeesApi } from "../lib/api";

export function TaskAssignmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAssignTasks = user?.role === "manager" || user?.role === "admin";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | "">("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees-list"],
    queryFn: () => employeesApi.list().then((r) => r.data),
    enabled: canAssignTasks,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !assignedTo) return;

    setLoading(true);
    setError("");

    try {
      await tasksApi.create({
        title,
        description,
        assigned_to: Number(assignedTo),
        assigned_by: user.employee_id,
        priority,
        due_date: dueDate,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(", "));
      } else {
        setError("Failed to create task. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Minimum due date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assign Task</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create and assign a new task to an employee
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-blue-600">assignment_add</span>
            New Task
          </h3>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">check_circle</span>
              <span>Task created successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
            {/* Title */}
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Task Title <span className="text-red-500">*</span></span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete Q4 report"
                required
                autoFocus
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </label>

            {/* Description */}
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Description <span className="text-red-500">*</span></span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail..."
                required
                rows={4}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assign To */}
              <label className="flex flex-col">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Assign To <span className="text-red-500">*</span></span>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : "")}
                  required
                  disabled={employeesLoading}
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="">Select employee...</option>
                  {Array.isArray(employees) &&
                    employees
                      .filter((emp: any) => emp.is_active)
                      .map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.employee_code})
                        </option>
                      ))}
                </select>
              </label>

              {/* Priority */}
              <label className="flex flex-col">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Priority <span className="text-red-500">*</span></span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            {/* Due Date */}
            <label className="flex flex-col max-w-xs">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Due Date <span className="text-red-500">*</span></span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={minDateStr}
                required
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </label>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success || !assignedTo}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium h-10 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Task...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">add_task</span>
                    Create & Assign Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
