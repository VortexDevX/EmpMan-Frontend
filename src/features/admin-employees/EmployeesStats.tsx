import { StatsCard } from "../../components/ui/StatsCard";
import type { EmployeeStats } from "./types";

export function EmployeesStats({ stats }: { stats: EmployeeStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[
        { label: "Total", value: stats.total, icon: "group", colorBg: "bg-blue-50 dark:bg-blue-900/20", colorText: "text-blue-600 dark:text-blue-400" },
        { label: "Active", value: stats.active, icon: "check_circle", colorBg: "bg-emerald-50 dark:bg-emerald-900/20", colorText: "text-emerald-600 dark:text-emerald-400" },
        { label: "Inactive", value: stats.inactive, icon: "person_off", colorBg: "bg-rose-50 dark:bg-rose-900/20", colorText: "text-rose-600 dark:text-rose-400" },
      ].map((s) => (
        <StatsCard
          key={s.label}
          compact
          label={s.label}
          value={s.value}
          icon={s.icon}
          iconBg={s.colorBg}
          iconColor={s.colorText}
          className="glass-panel"
        />
      ))}
    </div>
  );
}
