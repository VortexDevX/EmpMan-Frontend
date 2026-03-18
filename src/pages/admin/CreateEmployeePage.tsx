// src/pages/admin/CreateEmployeePage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { employeesApi, departmentsApi } from "../../lib/api";

export function CreateEmployeePage() {
  const navigate = useNavigate();

  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"employee" | "manager" | "admin">("employee");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    employee_code: string;
    password: string;
    full_name: string;
  } | null>(null);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  // Generate a random password suggestion
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await employeesApi.create({
        employee_code: employeeCode.toUpperCase(),
        full_name: fullName,
        email,
        password,
        role,
        ...(departmentId ? { department_id: Number(departmentId) } : {}),
      });

      setCreatedCredentials({
        employee_code: employeeCode.toUpperCase(),
        password,
        full_name: fullName,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(", "));
      } else {
        setError("Failed to create employee. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Employee Code: ${createdCredentials.employee_code}\nPassword: ${createdCredentials.password}\n\nPlease log in at the portal and set up your authenticator app (2FA) on first login.`;
    navigator.clipboard.writeText(text).catch(() => null);
  };

  // Show success screen with credentials to share
  if (createdCredentials) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employee Created</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Share these credentials with the employee</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden max-w-lg">
          <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span className="font-semibold">Account created successfully!</span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-3">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Name</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{createdCredentials.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Employee Code</span>
                <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">{createdCredentials.employee_code}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Password</span>
                <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">{createdCredentials.password}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">info</span>
              <span>The employee will be required to set up two-factor authentication (TOTP) on their first login.</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyCredentials}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-10 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                Copy Credentials
              </button>
              <button
                onClick={() => navigate("/admin/employees")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-slate-400 transition-colors flex items-center gap-2"
              >
                View All Employees
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Employee</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create a new employee account. Credentials must be shared manually.
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
            <span className="material-symbols-outlined text-[20px] text-blue-600">person_add</span>
            Employee Details
          </h3>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee Code */}
              <label className="flex flex-col">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Employee Code <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="EMP101"
                  required
                  autoFocus
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
                />
              </label>

              {/* Full Name */}
              <label className="flex flex-col">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Full Name <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </label>
            </div>

            {/* Email */}
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Email <span className="text-red-500">*</span></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                required
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm max-w-md"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role */}
              <label className="flex flex-col">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Role <span className="text-red-500">*</span></span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "employee" | "manager" | "admin")}
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              {/* Department */}
              <label className="flex flex-col">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">Department</span>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : "")}
                  className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="">Select department...</option>
                  {Array.isArray(departments) &&
                    departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            {/* Password */}
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1.5">
                Initial Password <span className="text-red-500">*</span>
              </span>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="shrink-0 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">casino</span>
                  Generate
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This password will be shared with the employee for their first login.</p>
            </label>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium h-10 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Create Employee
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
