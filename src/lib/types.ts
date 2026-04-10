/**
 * Shared TypeScript types — matched to production API responses
 */

// ─── Auth ────────────────────────────────────────────────────
export interface LoginResponse {
  access_token: string;
  token_type: string;
  employee_id: number;
  role: string;
  full_name: string;
}

export interface AuthUser {
  employee_id: number;
  employee_code: string;
  role: "admin" | "manager" | "employee";
  full_name: string;
}

// ─── Employee ────────────────────────────────────────────────
export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  role: string;
  profile_complete: boolean;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeProfile {
  id: number;
  employee_id: number;
  age: number;
  gender: string;
  department_id: number;
  job_level: string;
  job_title: string;
  joining_date: string;
  annual_salary: string;
  manager_id: number | null;
  data_source: string;
  last_updated: string;
}

export interface CreateProfileRequest {
  age: number;
  gender: string;
  department_id: number;
  job_level: string;
  job_title: string;
  joining_date: string;
  annual_salary: number;
  manager_id?: number;
  data_source?: string;
}

export interface UpdateProfileRequest {
  age?: number;
  gender?: string;
  department_id?: number;
  job_level?: string;
  job_title?: string;
  joining_date?: string;
  annual_salary?: number;
  manager_id?: number;
}

// ─── Department ──────────────────────────────────────────────
export interface Department {
  id: number;
  name: string;
  description: string;
}

// ─── Task ────────────────────────────────────────────────────
export interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_by: number;
  department_id: number;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "submitted_for_review" | "changes_requested" | "approved" | "rejected";
  due_date: string;
  completed_at: string | null;
  submitted_for_review_at?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  evidence_refs?: unknown[];
  created_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  author_id: number;
  message: string;
  created_at: string;
}

// ─── Survey ──────────────────────────────────────────────────
export interface Survey {
  id: number;
  employee_id: number;
  job_satisfaction_score: number;
  workload_rating: number;
  work_life_balance: number;
  additional_comments?: string;
  created_at: string;
}

export interface SubmitSurveyRequest {
  job_satisfaction_score: number;
  workload_rating: number;
  work_life_balance: number;
  additional_comments?: string;
}

// ─── Holiday ─────────────────────────────────────────────────
export interface Holiday {
  id: number;
  date: string;
  name: string;
  holiday_type: string;
}

// ─── Device ──────────────────────────────────────────────────
export interface Device {
  id: number;
  employee_id: number;
  mac_address: string;
  ip_address: string;
  device_name: string;
  device_type: string;
  is_blocked: boolean;
}

export interface RegisterDeviceRequest {
  employee_id: number;
  mac_address: string;
  ip_address?: string;
  device_name: string;
  device_type: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardOverview {
  total_employees: number;
  active_employees: number;
  departments: number;
  [key: string]: unknown;
}

export interface TeamProductivity {
  [key: string]: unknown;
}

export interface BurnoutAlert {
  employee_id: number;
  employee_name: string;
  risk_level: string;
  score: number;
  [key: string]: unknown;
}

export interface EmployeeSummary {
  [key: string]: unknown;
}

// ─── ML Predictions ──────────────────────────────────────────
export interface Prediction {
  id: number;
  employee_id: number;
  prediction_date: string;
  prediction_type: "burnout" | "productivity" | "attrition" | "workload";
  score: number | null;
  risk_level: "low" | "medium" | "high" | "critical" | "unknown";
  model_version?: string;
  features_snapshot?: Record<string, unknown>;
  predicted_workload_hours?: number | null;
  future_productivity_trend?: string | null;
  future_workload_status?: string | null;
  created_at: string;
}

// ─── Create Employee ─────────────────────────────────────────
export interface CreateEmployeeRequest {
  employee_code: string;
  full_name: string;
  email: string;
  password: string;
  role: "employee" | "manager" | "admin";
  department_id?: number;
}

// ─── Create Task ─────────────────────────────────────────────
export interface CreateTaskRequest {
  title: string;
  description: string;
  assigned_to: number;
  assigned_by: number;
  department_id?: number;
  priority: "low" | "medium" | "high";
  due_date: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  work_date: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  status: string;
  attendance_source: string;
  work_minutes: number;
  notes?: string | null;
}

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  is_paid: boolean;
  max_days_per_year: number;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_year: number;
  allocated_days: number;
  used_days: number;
  carry_forward_days: number;
  adjusted_days: number;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  handover_note?: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "withdrawn";
  requested_at: string;
  decision_note?: string | null;
}

export interface PendingApproval {
  approval_type: "leave" | "task_review";
  reference_id: number;
  employee_id: number;
  employee_code?: string;
  full_name?: string;
  submitted_at: string;
  status: string;
  priority?: string | null;
  summary: string;
  requested_by: number;
  target_start_date?: string | null;
  target_end_date?: string | null;
  meta?: Record<string, unknown>;
}

// ─── TOTP Registration ──────────────────────────────────────
export interface TotpSetupResponse {
  employee_id: number;
  employee_code: string;
  totp_secret: string;
  qr_code_url: string;
  message: string;
}
