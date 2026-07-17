// src/pages/SetupTotpPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../lib/api";
import type { TotpSetupResponse } from "../lib/types";
import { AuthCard, AuthPage } from "../components/ui/AuthLayout";
import { FormAlert } from "../components/ui/FormLayout";

export function SetupTotpPage() {
  const navigate = useNavigate();
  const { pendingEmployeeId, pendingSetupToken, clearTotpSetup } = useAuth();

  const [step, setStep] = useState<"generate" | "verify">("generate");
  const [totpData, setTotpData] = useState<TotpSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGenerateQR = async () => {
    if (!pendingEmployeeId || !pendingSetupToken) {
      setError("Your setup session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authApi.register(pendingSetupToken);
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
    if (!totpData?.confirmation_token) return;

    setLoading(true);
    setError("");

    try {
      await authApi.confirmTotp(totpData.confirmation_token, verifyCode);
      setSuccess(true);
      setTimeout(() => {
        clearTotpSetup();
        navigate("/login");
      }, 2000);
    } catch {
      setError("Invalid code. Please check your authenticator app and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearTotpSetup();
    navigate("/login");
  };

  if (!pendingEmployeeId || !pendingSetupToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md surface-card p-8 text-center">
          <div className="mb-6 mx-auto h-16 w-16 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-amber-600">warning</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Expired</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Please log in again to set up two-factor authentication.
          </p>
          <button onClick={handleBackToLogin} className="btn-primary w-full h-12">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthPage firstGlowClassName="bg-emerald-500/5">
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <AuthCard
          icon="security"
          iconClassName="bg-emerald-500/10 text-emerald-600"
          title="Set Up Two-Factor Auth"
          subtitle={step === "generate"
            ? "Secure your account with an authenticator app"
            : "Scan the QR code and verify your setup"}
          maxWidthClassName="max-w-[480px]"
          footer={
            <button
              onClick={handleBackToLogin}
              className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Login
            </button>
          }
        >
            {error && (
              <FormAlert tone="error">{error}</FormAlert>
            )}

            {success && (
              <FormAlert tone="success">TOTP set up successfully! Redirecting to login...</FormAlert>
            )}

            {step === "generate" && (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary-700 dark:text-primary-300">info</span>
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
                  className="btn-primary w-full h-12 disabled:opacity-55 disabled:cursor-not-allowed"
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
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
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
                      className="input-shell w-full h-12 px-4 text-center text-xl font-mono"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || verifyCode.length !== 6 || success}
                    className="btn-primary w-full h-12 disabled:opacity-55 disabled:cursor-not-allowed"
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
        </AuthCard>
      </main>
    </AuthPage>
  );
}
