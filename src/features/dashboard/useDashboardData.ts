import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, gatewayApi, predictionsApi, tasksApi } from "../../lib/api";
import { gatewayAdminEnabled } from "../../lib/deployment";
import { useAuth } from "../../contexts/AuthContext";

export function useDashboardData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isEmployee = user?.role === "employee";
  const isLeadership = isAdmin || isManager;
  const showPersonalExecution = !isAdmin;

  const { data: overview, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => dashboardApi.getOverview().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: productivity } = useQuery({
    queryKey: ["team-productivity"],
    queryFn: () => dashboardApi.getTeamProductivity().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: burnoutAlerts } = useQuery({
    queryKey: ["burnout-alerts"],
    queryFn: () => dashboardApi.getBurnoutAlerts().then((r) => r.data),
    enabled: isLeadership,
  });

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", user?.employee_id],
    queryFn: () => tasksApi.getForEmployee(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id && showPersonalExecution,
  });

  const { data: mySummary } = useQuery({
    queryKey: ["my-summary", user?.employee_id],
    queryFn: () => dashboardApi.getEmployeeSummary(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id && showPersonalExecution,
  });

  const { data: latestPredictions } = useQuery({
    queryKey: ["latest-predictions", user?.employee_id],
    queryFn: () => predictionsApi.getLatest(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id && showPersonalExecution,
  });

  const { data: connectedData } = useQuery({
    queryKey: ["admin", "connected"],
    queryFn: () => gatewayApi.getConnected().then((r) => r.data?.data),
    enabled: isAdmin && gatewayAdminEnabled,
    refetchInterval: (query) => (query.state.error ? false : 20000),
  });

  const tasks = Array.isArray(myTasks) ? myTasks : [];
  const pendingTasks = tasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "done");

  const teamRows = Array.isArray(productivity) ? productivity : [];
  const chartData = teamRows.map((row: any) => ({
    employee_id: row.employee_id,
    employee: `#${row.employee_id}`,
    avg_productivity: Number(Number(row.avg_productivity ?? 0).toFixed(1)),
  }));

  const alerts = Array.isArray(burnoutAlerts) ? burnoutAlerts : [];
  const connectedDevices = connectedData?.devices || [];
  const blockedMacs = connectedData?.blocked_macs || [];

  const burnoutRisk = latestPredictions?.burnout?.risk_level || mySummary?.burnout_risk || "unknown";
  const workloadStatus = latestPredictions?.workload?.future_workload_status || "unknown";

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  return {
    user,
    isAdmin,
    isManager,
    isEmployee,
    isLeadership,
    showPersonalExecution,
    overview,
    isLoading,
    pendingTasks,
    completedTasks,
    chartData,
    alerts,
    connectedDevices,
    blockedMacs,
    burnoutRisk,
    workloadStatus,
    mySummary,
    refreshing,
    handleRefresh,
  };
}
