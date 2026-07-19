import type { ReactNode } from "react";

interface FormPageHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

interface FormPanelProps {
  title: string;
  icon: string;
  children: ReactNode;
}

interface FormAlertProps {
  tone: "error" | "success";
  children: ReactNode;
}

interface FormSubmitButtonProps {
  loading: boolean;
  loadingLabel: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

export const fieldLabelClass =
  "text-slate-700 dark:text-slate-300 text-sm font-semibold pb-1.5";
export const fieldInputClass =
  "input-shell h-10 px-3 text-sm";
export const fieldTextareaClass =
  "input-shell px-3 py-2 text-sm resize-none";

export function FormPageHeader({ title, subtitle, onBack }: FormPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/80 dark:border-slate-700/70 pb-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>
      <button
        onClick={onBack}
        className="self-start text-sm font-medium text-slate-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-300 flex items-center gap-1 transition-colors rounded-md"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>
    </div>
  );
}

export function FormPanel({ title, icon, children }: FormPanelProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary-600 dark:text-primary-400">{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function FormAlert({ tone, children }: FormAlertProps) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400";
  const icon = tone === "success" ? "check_circle" : "error";

  return (
    <div
      className={`mb-4 p-3 rounded-lg border text-sm flex items-start gap-2 ${styles}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function FormSubmitButton({
  loading,
  loadingLabel,
  label,
  icon,
  disabled,
}: FormSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="btn-primary disabled:opacity-55 disabled:cursor-not-allowed text-sm font-semibold h-10 px-6 flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingLabel}
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
          {label}
        </>
      )}
    </button>
  );
}
