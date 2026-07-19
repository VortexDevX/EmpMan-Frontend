// src/pages/LoginPage.tsx

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { getDefaultRoute, type UserRole } from "../lib/routes";
import { AuthCard, AuthPage } from "../components/ui/AuthLayout";
import { FormAlert } from "../components/ui/FormLayout";
import { getApiErrorMessage, getApiStatus } from "../lib/errors";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithoutTotp } = useAuth();

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
      const preflight = await loginWithoutTotp(employeeCode, password);
      if (preflight.needsTotp) {
        navigate("/setup-totp");
        return;
      }
      if (totpCode.length !== 6) {
        setError("Enter the 6-digit code from your authenticator app.");
        return;
      }
      await login(employeeCode, password, totpCode);
      
      // Read role from localStorage (set by login function)
      const storedUser = localStorage.getItem("auth_user");
      const role = storedUser ? JSON.parse(storedUser).role : "employee";
      
      navigate(getDefaultRoute(role as UserRole));
    } catch (err: unknown) {
      console.error("[Login] Error:", err);
      
      if (getApiStatus(err) === 401) {
        setError("Invalid password or authenticator code.");
      } else {
        setError(getApiErrorMessage(err, "Login failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage>
      <main className="flex-1 flex items-center justify-center p-4 z-10 pb-8">
        <AuthCard
          icon="monitoring"
          title="Sign in to Employee Dashboard"
          subtitle="Employee Performance & Operations Portal"
          footer={
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
                className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 hover:underline transition-all flex items-center gap-1"
              >
                Need help signing in?
              </a>
            </div>
          }
        >
            {error && (
              <FormAlert tone="error">{error}</FormAlert>
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
                  className="input-shell w-full h-12 px-4"
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
                    className="input-shell w-full h-12 px-4 pr-12"
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
                  className="input-shell w-full h-12 px-4 text-center text-xl font-mono"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Enter 6-digit code from Google Authenticator
                </p>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full h-12 disabled:opacity-55 disabled:cursor-not-allowed group"
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
        </AuthCard>
      </main>

      {/* Bottom Links */}
      <div className="w-full text-center z-10 pb-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </AuthPage>
  );
}
