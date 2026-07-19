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
      const authenticatedUser = await login(employeeCode, password, totpCode);
      navigate(getDefaultRoute(authenticatedUser.role as UserRole));
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
      <main id="main-content" className="flex-1 flex items-center justify-center p-4 z-10 pb-8">
        <AuthCard
          icon="monitoring"
          title="Sign in to Employee Dashboard"
          subtitle="Employee Performance & Operations Portal"
          footer={
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-start gap-2 max-w-[320px]">
                <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5 shrink-0" aria-hidden="true">
                  security
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  Two-factor authentication is required for all logins.
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Need help? Contact your manager or system administrator.
              </p>
            </div>
          }
        >
            {error && (
              <FormAlert tone="error">{error}</FormAlert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={loading}>
              {/* Employee Code */}
              <div className="flex flex-col w-full">
                <label htmlFor="employee-code" className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                  Employee Code
                </label>
                <input
                  id="employee-code"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="EMP101"
                  required
                  autoFocus
                  autoComplete="username"
                  className="input-shell w-full h-12 px-4"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col w-full">
                <label htmlFor="current-password" className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="current-password"
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* TOTP Code */}
              <div className="flex flex-col w-full">
                <label htmlFor="authenticator-code" className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                  Authenticator Code
                </label>
                <input
                  id="authenticator-code"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-describedby="authenticator-hint"
                  className="input-shell w-full h-12 px-4 text-center text-xl font-mono"
                />
                <p id="authenticator-hint" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Enter the current 6-digit code from your authenticator app.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full h-12 disabled:opacity-55 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1" aria-hidden="true">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>
        </AuthCard>
      </main>

      <footer className="w-full text-center z-10 pb-6 px-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Authorized workforce access only · Protected with two-factor authentication
        </p>
      </footer>
    </AuthPage>
  );
}
