// src/components/ui/StatsCard.tsx
interface StatsCardProps {
  title?: string;
  label?: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBg?: string;
  className?: string;
  compact?: boolean;
  hint?: string;
}

export function StatsCard({
  title,
  label,
  value,
  icon,
  trend,
  iconColor = "text-primary-600 dark:text-primary-400",
  iconBg = "bg-slate-100/80 dark:bg-slate-700/70 ring-1 ring-white/40 dark:ring-slate-600/40",
  className = "surface-card",
  compact = false,
  hint,
}: StatsCardProps) {
  const displayTitle = title ?? label ?? "";

  if (compact) {
    return (
      <div className={`${className} p-4`}>
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>{icon}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{displayTitle}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{displayTitle}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
