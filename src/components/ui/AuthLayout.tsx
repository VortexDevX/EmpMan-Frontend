import type { ReactNode } from "react";

interface AuthPageProps {
  children: ReactNode;
  firstGlowClassName?: string;
  secondGlowClassName?: string;
}

interface AuthCardProps {
  icon: string;
  iconClassName?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export function AuthPage({
  children,
  firstGlowClassName = "bg-primary-600/10",
  secondGlowClassName = "bg-blue-600/10",
}: AuthPageProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute inset-x-0 top-0 h-1 ${firstGlowClassName}`} />
        <div className={`absolute left-0 top-0 h-full w-px ${secondGlowClassName}`} />
        <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-700 text-white shadow-lg shadow-primary-900/15">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">workspaces</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950 dark:text-white section-title">Workforce OS</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">People operations command center</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Secure access
        </div>
      </header>
      {children}
    </div>
  );
}

export function AuthCard({
  icon,
  iconClassName = "bg-cyan-500/10 text-cyan-600",
  title,
  subtitle,
  children,
  footer,
  maxWidthClassName = "max-w-[440px]",
}: AuthCardProps) {
  return (
    <div className={`w-full ${maxWidthClassName} surface-card overflow-hidden`}>
      <div className="h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-blue-600" aria-hidden="true" />
      <div className="px-6 sm:px-8 pt-8 pb-2 flex flex-col items-center">
        <div className={`mb-5 h-14 w-14 rounded-2xl flex items-center justify-center ${iconClassName}`} aria-hidden="true">
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>
        <h1 className="text-slate-900 dark:text-white text-[26px] font-bold leading-tight text-center section-title">
          {title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center mt-2">
          {subtitle}
        </p>
      </div>

      <div className="px-6 sm:px-8 py-6 w-full">{children}</div>

      {footer && (
        <div className="bg-slate-50/80 dark:bg-slate-900/55 px-6 sm:px-8 py-5 border-t border-slate-200 dark:border-slate-700/70">
          {footer}
        </div>
      )}
    </div>
  );
}
