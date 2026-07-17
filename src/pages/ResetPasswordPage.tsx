import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard, AuthPage } from "../components/ui/AuthLayout";
import { FormAlert } from "../components/ui/FormLayout";
import { authApi } from "../lib/api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const tokenId = params.get("id") || "";
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!tokenId || !token) return setError("This password reset link is incomplete.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await authApi.resetPassword(tokenId, token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage>
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <AuthCard icon="lock_reset" title="Set a new password" subtitle="This link can only be used once">
          {error && <FormAlert tone="error">{error}</FormAlert>}
          {success ? (
            <div className="flex flex-col gap-5">
              <FormAlert tone="success">Your password has been reset.</FormAlert>
              <Link className="btn-primary h-12" to="/login">Continue to sign in</Link>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Use at least 12 characters with uppercase, lowercase, a number, and a symbol.
              </p>
              <input className="input-shell h-12 px-4" type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <input className="input-shell h-12 px-4" type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              <button className="btn-primary h-12" type="submit" disabled={loading}>{loading ? "Resetting…" : "Reset password"}</button>
            </form>
          )}
        </AuthCard>
      </main>
    </AuthPage>
  );
}
