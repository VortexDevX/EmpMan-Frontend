// src/pages/SetupTotpPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../lib/api";
import type { TotpSetupResponse } from "../lib/types";

export function SetupTotpPage() {
  const navigate = useNavigate();
  const { pendingEmployeeId, clearTotpSetup } = useAuth();

  const [step, setStep] = useState<"generate" | "verify">("generate");
  const [totpData, setTotpData] = useState<TotpSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGenerateQR = async () => {
    if (!pendingEmployeeId) {
      setError("No employee ID found. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authApi.register(pendingEmployeeId);
      setTotpData(res.data);
      setStep("verify");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Failed to generate TOTP setup. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingEmployeeId) return;

    setLoading(true);
    setError("");

    try {
      await authApi.verify(pendingEmployeeId, verifyCode);
      setSuccess(true);
      setTimeout(() => {
        clearTotpSetup();
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError("Invalid code. Please check your authenticator app and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearTotpSetup();
    navigate("/login");
  };

  if (!pendingEmployeeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel rounded-2xl p-8 text-center">
          <div className="mb-6 mx-auto h-16 w-16 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-amber-600">warning</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Expired</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Please log in again to set up two-factor authentication.
          </p>
          <button onClick={handleBackToLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 rounded-lg transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/5 blur-[100px]"></div>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[480px] glass-panel rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-10 pb-2 flex flex-col items-center">
            <div className="mb-6 h-16 w-16 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[32px]">security</span>
            </div>
            <h2 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center section-title">
              Set Up Two-Factor Auth
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center mt-2">
              {step === "generate"
                ? "Secure your account with an authenticator app"
                : "Scan the QR code and verify your setup"}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-6 w-full">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">check_circle</span>
                <span>TOTP set up successfully! Redirecting to login...</span>
              </div>
            )}

            {step === "generate" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">info</span>
                    Before you begin
                  </h3>
                  <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
                    <li>Install <strong>Google Authenticator</strong> on your phone</li>
                    <li>Click the button below to generate a QR code</li>
                    <li>Scan the QR code with the authenticator app</li>
                    <li>Enter the 6-digit code to verify setup</li>
                  </ol>
                </div>

                <button
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-medium h-12 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">qr_code</span>
                      <span>Generate QR Code</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {step === "verify" && totpData && (
              <div className="flex flex-col gap-5">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-inner">
                    <img
                      src={totpData.qr_code_url}
                      alt="TOTP QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Or manually enter this secret:
                    </p>
                    <code className="mt-1 inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 select-all">
                      {totpData.totp_secret}
                    </code>
                  </div>
                </div>

                {/* Verify Form */}
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <label className="flex flex-col w-full">
                    <span className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Enter 6-Digit Code
                    </span>
                  <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      autoFocus
                      className="w-full h-12 px-4 rounded-lg border border-slate-300/80 dark:border-slate-600 bg-white/80 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 text-center text-xl tracking-[0.3em] font-mono"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || verifyCode.length !== 6 || success}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-medium h-12 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                        <span>Verify & Complete Setup</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="glass-soft px-6 sm:px-8 py-5 border-t border-white/30 dark:border-slate-700/50">
            <button
              onClick={handleBackToLogin}
              className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
