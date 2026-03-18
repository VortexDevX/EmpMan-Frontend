// src/pages/LoginPage.tsx

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../lib/api";
import { getDefaultRoute, type UserRole } from "../lib/routes";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(employeeCode, password, totpCode);
      
      // Read role from localStorage (set by login function)
      const storedUser = localStorage.getItem("auth_user");
      const role = storedUser ? JSON.parse(storedUser).role : "employee";
      
      navigate(getDefaultRoute(role as UserRole));
    } catch (err: any) {
      console.error("[Login] Error:", err);
      
      if (err.response?.status === 404) {
        setError("Employee not found. Check your employee code.");
      } else if (err.response?.status === 401) {
        setError("Invalid password or authenticator code.");
      } else if (err.response?.status === 400) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string" && detail.includes("TOTP not registered")) {
          // Redirect to TOTP setup page
          // We need to get the employee ID first
          try {
            const empRes = await authApi.getEmployeeByCode(employeeCode);
            const empId = empRes.data.id;
            // Store pending employee ID for TOTP setup
            sessionStorage.setItem("pending_totp_employee_id", String(empId));
            navigate("/setup-totp");
            return;
          } catch {
            setError("TOTP not set up. Please contact your administrator.");
          }
        } else if (typeof detail === "string" && detail.includes("Password not set")) {
          setError("Password not set. Contact administrator.");
        } else {
          setError(detail || "Login failed.");
        }
      } else {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d: any) => d.msg).join(", "));
        } else if (typeof detail === "string") {
          setError(detail);
        } else {
          setError(err.message || "Login failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/5 blur-[100px]"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 pb-8">
        <div className="w-full max-w-[440px] glass-panel rounded-2xl overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-10 pb-2 flex flex-col items-center">
            <div className="mb-6 h-16 w-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[32px]">hub</span>
            </div>
            <h2 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center section-title">
              Sign in to Workforce OS
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center mt-2">
              Workforce Optimization Platform
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6 w-full">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Employee Code */}
              <label className="flex flex-col w-full">
                <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                  Employee Code
                </span>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="EMP101"
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full h-12 px-4 rounded-lg border border-slate-300/80 dark:border-slate-600 bg-white/80 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
                />
              </label>

              {/* Password */}
              <label className="flex flex-col w-full">
                <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full h-12 px-4 pr-12 rounded-lg border border-slate-300/80 dark:border-slate-600 bg-white/80 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </label>

              {/* TOTP Code */}
              <label className="flex flex-col w-full">
                <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                  Authenticator Code
                </span>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  className="w-full h-12 px-4 rounded-lg border border-slate-300/80 dark:border-slate-600 bg-white/80 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200 text-center text-xl tracking-[0.3em] font-mono"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Enter 6-digit code from Google Authenticator
                </p>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="mt-2 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed text-white font-medium h-12 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="glass-soft px-6 sm:px-8 py-6 border-t border-white/30 dark:border-slate-700/50">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-start gap-2 max-w-[320px]">
                <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5 shrink-0">
                  security
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  Two-factor authentication is required for all logins.
                </p>
              </div>
              <a
                href="#"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all flex items-center gap-1"
              >
                Need help signing in?
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Links */}
      <div className="w-full text-center z-10 pb-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </div>
  );
}
