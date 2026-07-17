import { DashboardHeader } from "./DashboardHeader";
import { GatewayStatusSection } from "./GatewayStatusSection";
import { PersonalExecutionSection } from "./PersonalExecutionSection";
import { WorkforceSnapshotSection } from "./WorkforceSnapshotSection";
import type { DashboardData } from "./types";

export function DashboardView(data: DashboardData) {
  if (data.isLoading && data.isLeadership) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        isAdmin={data.isAdmin}
        isManager={data.isManager}
        refreshing={data.refreshing}
        handleRefresh={data.handleRefresh}
      />

      {data.showPersonalExecution && (
        <PersonalExecutionSection
          isManager={data.isManager}
          pendingTasks={data.pendingTasks}
          completedTasks={data.completedTasks}
          mySummary={data.mySummary}
          burnoutRisk={data.burnoutRisk}
          workloadStatus={data.workloadStatus}
        />
      )}

      {data.isLeadership && (
        <WorkforceSnapshotSection
          overview={data.overview}
          alerts={data.alerts}
          chartData={data.chartData}
        />
      )}

      <GatewayStatusSection
        isAdmin={data.isAdmin}
        connectedDevices={data.connectedDevices}
        blockedMacs={data.blockedMacs}
      />

      {data.isEmployee && (
        <div className="surface-card p-4 text-sm text-slate-600 dark:text-slate-300">
          Tip: Use <strong>Insights</strong> for interpretation and next-step recommendations from your latest signals.
        </div>
      )}
    </div>
  );
}
