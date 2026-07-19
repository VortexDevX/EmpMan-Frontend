import { gatewayAdminEnabled } from "../../lib/deployment";
import { KPICard, SectionTitle } from "./DashboardPrimitives";
import type { GatewayConnectedDevice } from "../../lib/types";

export function GatewayStatusSection({
  isAdmin,
  connectedDevices,
  blockedMacs,
}: {
  isAdmin: boolean;
  connectedDevices: GatewayConnectedDevice[];
  blockedMacs: string[];
}) {
  if (!isAdmin) return null;

  if (!gatewayAdminEnabled) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/40">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Gateway widgets are disabled in this deployment (`VITE_ENABLE_GATEWAY_ADMIN=false`).
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
      <SectionTitle title="Gateway Live Status" subtitle="Network layer status from Pi Gateway." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Connected Devices" value={connectedDevices.length} icon="router" tone="blue" />
        <KPICard
          label="Authenticated Online"
          value={connectedDevices.filter((device) => device.authenticated && !device.blocked).length}
          icon="wifi"
          tone="teal"
        />
        <KPICard label="Blocked MACs" value={blockedMacs.length} icon="block" tone="rose" />
      </div>
    </div>
  );
}
