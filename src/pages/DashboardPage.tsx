import { DashboardView } from "../features/dashboard/DashboardView";
import { useDashboardData } from "../features/dashboard/useDashboardData";

export function DashboardPage() {
  return <DashboardView {...useDashboardData()} />;
}
