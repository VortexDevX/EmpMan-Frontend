import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { departmentsApi, employeesApi } from "../../lib/api";
import type { CreatedCredentials, EmployeeRole } from "./types";

export function useCreateEmployee() {
  const navigate = useNavigate();

  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EmployeeRole>("employee");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

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
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg).join(", "));
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

  return {
    employeeCode,
    fullName,
    email,
    password,
    role,
    departmentId,
    loading,
    error,
    createdCredentials,
    departments,
    setEmployeeCode,
    setFullName,
    setEmail,
    setPassword,
    setRole,
    setDepartmentId,
    generatePassword,
    handleSubmit,
    handleCopyCredentials,
    goBack: () => navigate(-1),
    goToEmployees: () => navigate("/admin/employees"),
  };
}
