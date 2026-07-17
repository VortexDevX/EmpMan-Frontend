import type { KpiCardProps } from "./types";

export function KPICard({
  label,
  value,
  icon,
  tone = "slate",
  hint,
}: KpiCardProps) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-300",
    teal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    blue: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  };

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export function score(value: unknown, decimals = 1): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.0";
  return num.toFixed(decimals);
}
