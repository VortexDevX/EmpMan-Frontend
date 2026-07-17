import type { AuthUser } from "../../lib/types";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  tone?: "slate" | "teal" | "amber" | "rose" | "blue";
  hint?: string;
}

export interface DashboardData {
  user: AuthUser | null;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isLeadership: boolean;
  showPersonalExecution: boolean;
  overview: any;
  isLoading: boolean;
  pendingTasks: any[];
  completedTasks: any[];
  chartData: any[];
  alerts: any[];
  connectedDevices: any[];
  blockedMacs: string[];
  burnoutRisk: string;
  workloadStatus: string;
  mySummary: any;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
}
