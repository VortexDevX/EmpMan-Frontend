// src/pages/TaskAssignmentPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { tasksApi, employeesApi } from "../lib/api";
import { EmployeeLink } from "../components/EmployeeLink";
import {
  fieldInputClass,
  fieldLabelClass,
  fieldTextareaClass,
  FormAlert,
  FormPageHeader,
  FormPanel,
  FormSubmitButton,
} from "../components/ui/FormLayout";

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
  const selectedEmployee = Array.isArray(employees)
    ? employees.find((emp: any) => emp.id === Number(assignedTo))
    : null;

  return (
    <div className="space-y-6">
      <FormPageHeader
        title="Assign Task"
        subtitle="Create and assign a new task to an employee"
        onBack={() => navigate(-1)}
      />

      <FormPanel title="New Task" icon="assignment_add">
          {error && (
            <FormAlert tone="error">{error}</FormAlert>
          )}
          {success && (
            <FormAlert tone="success">Task created successfully! Redirecting...</FormAlert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
            {/* Title */}
            <label className="flex flex-col">
              <span className={fieldLabelClass}>Task Title <span className="text-red-500">*</span></span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete Q4 report"
                required
                autoFocus
                className={fieldInputClass}
              />
            </label>

            {/* Description */}
            <label className="flex flex-col">
              <span className={fieldLabelClass}>Description <span className="text-red-500">*</span></span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail..."
                required
                rows={4}
                className={fieldTextareaClass}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assign To */}
              <label className="flex flex-col">
                <span className={fieldLabelClass}>Assign To <span className="text-red-500">*</span></span>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : "")}
                  required
                  disabled={employeesLoading}
                  className={fieldInputClass}
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
                {selectedEmployee && (
                  <div className="mt-2">
                    <EmployeeLink employeeId={selectedEmployee.id} className="text-xs font-medium">
                      View {selectedEmployee.full_name}'s details
                    </EmployeeLink>
                  </div>
                )}
              </label>

              {/* Priority */}
              <label className="flex flex-col">
                <span className={fieldLabelClass}>Priority <span className="text-red-500">*</span></span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className={fieldInputClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            {/* Due Date */}
            <label className="flex flex-col max-w-xs">
              <span className={fieldLabelClass}>Due Date <span className="text-red-500">*</span></span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={minDateStr}
                required
                className={fieldInputClass}
              />
            </label>

            {/* Submit */}
            <div className="pt-2">
              <FormSubmitButton
                loading={loading}
                loadingLabel="Creating Task..."
                label="Create & Assign Task"
                icon="add_task"
                disabled={success || !assignedTo}
              />
            </div>
          </form>
      </FormPanel>
    </div>
  );
}
