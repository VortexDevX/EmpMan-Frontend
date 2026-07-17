import {
  fieldInputClass,
  fieldLabelClass,
  FormAlert,
  FormPageHeader,
  FormPanel,
  FormSubmitButton,
} from "../../components/ui/FormLayout";
import type { CreateEmployeeFormState, EmployeeRole } from "./types";

type Props = Omit<CreateEmployeeFormState, "createdCredentials" | "handleCopyCredentials" | "goToEmployees">;

export function CreateEmployeeForm({
  employeeCode,
  fullName,
  email,
  password,
  role,
  departmentId,
  loading,
  error,
  departments,
  setEmployeeCode,
  setFullName,
  setEmail,
  setPassword,
  setRole,
  setDepartmentId,
  generatePassword,
  handleSubmit,
  goBack,
}: Props) {
  return (
    <div className="space-y-6">
      <FormPageHeader
        title="Create Employee"
        subtitle="Create a new employee account. Credentials must be shared manually."
        onBack={goBack}
      />

      <FormPanel title="Employee Details" icon="person_add">
          {error && (
            <FormAlert tone="error">{error}</FormAlert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className={fieldLabelClass}>Employee Code <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="EMP101"
                  required
                  autoFocus
                  className={`${fieldInputClass} font-mono`}
                />
              </label>

              <label className="flex flex-col">
                <span className={fieldLabelClass}>Full Name <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className={fieldInputClass}
                />
              </label>
            </div>

            <label className="flex flex-col">
              <span className={fieldLabelClass}>Email <span className="text-red-500">*</span></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                required
                className={`${fieldInputClass} max-w-md`}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className={fieldLabelClass}>Role <span className="text-red-500">*</span></span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as EmployeeRole)}
                  className={fieldInputClass}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label className="flex flex-col">
                <span className={fieldLabelClass}>Department</span>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : "")}
                  className={fieldInputClass}
                >
                  <option value="">Select department...</option>
                  {Array.isArray(departments) &&
                    departments.map((dept: { id: number; name: string }) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col">
              <span className={fieldLabelClass}>
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
                  className={`flex-1 ${fieldInputClass} font-mono`}
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

            <div className="pt-2">
              <FormSubmitButton
                loading={loading}
                loadingLabel="Creating..."
                label="Create Employee"
                icon="person_add"
              />
            </div>
          </form>
      </FormPanel>
    </div>
  );
}
