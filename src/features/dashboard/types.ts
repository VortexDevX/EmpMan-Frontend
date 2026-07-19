import type {
  AuthUser,
  BurnoutAlert,
  DashboardOverview,
  EmployeeSummary,
  GatewayConnectedDevice,
  ProductivityChartRow,
  Task,
} from "../../lib/types";

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
  overview: DashboardOverview | undefined;
  isLoading: boolean;
  error: unknown;
  pendingTasks: Task[];
  completedTasks: Task[];
  chartData: ProductivityChartRow[];
  alerts: BurnoutAlert[];
  connectedDevices: GatewayConnectedDevice[];
  blockedMacs: string[];
  burnoutRisk: string;
  workloadStatus: string;
  mySummary: EmployeeSummary | undefined;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
}
