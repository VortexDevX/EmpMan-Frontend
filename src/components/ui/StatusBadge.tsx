type StatusTone = "success" | "danger" | "warning" | "info" | "neutral";

interface StatusBadgeProps {
  children: string;
  tone?: StatusTone;
  className?: string;
  showDot?: boolean;
}

const toneClasses: Record<StatusTone, { badge: string; dot: string }> = {
  success: {
    badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  danger: {
    badge: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  warning: {
    badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  info: {
    badge: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  neutral: {
    badge: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
  showDot = true,
}: StatusBadgeProps) {
  const classes = toneClasses[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${classes.badge} ${className}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />}
      {children}
    </span>
  );
}
