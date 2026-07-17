import type { MouseEvent } from "react";
import { EmployeeLink } from "../../components/EmployeeLink";
import { StatsCard } from "../../components/ui/StatsCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { gatewayAdminEnabled } from "../../lib/deployment";
import type { AdminDevicesState, GatewayDevice } from "./types";

function GatewayAdminDisabled() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 section-title">
          <span className="material-symbols-outlined text-[24px] text-primary-600 dark:text-primary-400">router</span>
          Gateway Devices
        </h1>
      </div>
      <div className="surface-card p-6 border-amber-200/60 dark:border-amber-800/40">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Gateway admin features are disabled for this deployment (`VITE_ENABLE_GATEWAY_ADMIN=false`).
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Use local gateway UI context or enable gateway admin endpoints for this frontend environment.
        </p>
      </div>
    </div>
  );
}

function DeviceToast({ toast }: Pick<AdminDevicesState, "toast">) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg font-semibold text-sm text-white shadow-lg flex items-center gap-2 animate-in fade-in ${
        toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
      }`}
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      <span className="material-symbols-outlined text-[18px]">
        {toast.type === "success" ? "check_circle" : "error"}
      </span>
      {toast.text}
    </div>
  );
}

function DevicesHeader({
  isLoading,
  refetch,
  showLogs,
  setShowLogs,
  refetchLogs,
  kickAllMutation,
  stats,
}: Pick<AdminDevicesState, "isLoading" | "refetch" | "showLogs" | "setShowLogs" | "refetchLogs" | "kickAllMutation" | "stats">) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-primary-600 dark:text-primary-400">router</span>
          Gateway Devices
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage devices connected to the Pi-Gateway network.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex-1 sm:flex-none"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <span className={`material-symbols-outlined text-[18px] ${isLoading ? "animate-spin" : ""}`}>refresh</span>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex-1 sm:flex-none"
          onClick={() => { setShowLogs(!showLogs); if (!showLogs) refetchLogs(); }}
        >
          <span className="material-symbols-outlined text-[18px]">terminal</span>
          {showLogs ? "Hide Logs" : "View Logs"}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-all flex-1 sm:flex-none"
          onClick={() => kickAllMutation.mutate()}
          disabled={kickAllMutation.isPending || stats.online === 0}
        >
          <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
          Kick All ({stats.online})
        </button>
      </div>
    </div>
  );
}

function DeviceErrorBanner({ isError, errorDetail }: Pick<AdminDevicesState, "isError" | "errorDetail">) {
  if (!isError) return null;

  return (
    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-lg p-4 flex items-start gap-3">
      <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5">error</span>
      <div>
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Could not fetch live gateway devices</p>
        <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">
          {typeof errorDetail === "string" ? errorDetail : "Check that the local Pi-Gateway API is running and authenticated."}
        </p>
      </div>
    </div>
  );
}

function DeviceStats({ stats }: Pick<AdminDevicesState, "stats">) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[
        { label: "Online", value: stats.online, icon: "wifi", colorBg: "bg-emerald-50 dark:bg-emerald-900/20", colorText: "text-emerald-600 dark:text-emerald-400" },
        { label: "Total Devices", value: stats.total, icon: "dns", colorBg: "bg-primary-50 dark:bg-primary-900/20", colorText: "text-primary-700 dark:text-primary-300" },
        { label: "Blocked", value: stats.blocked, icon: "block", colorBg: "bg-rose-50 dark:bg-rose-900/20", colorText: "text-rose-600 dark:text-rose-400" },
      ].map((s) => (
        <StatsCard
          key={s.label}
          compact
          label={s.label}
          value={s.value}
          icon={s.icon}
          iconBg={s.colorBg}
          iconColor={s.colorText}
          className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/60 dark:ring-slate-700/60"
        />
      ))}
    </div>
  );
}

function DeviceFilters({
  tabs,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}: Pick<AdminDevicesState, "tabs" | "activeTab" | "setActiveTab" | "searchQuery" | "setSearchQuery">) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-medium px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 w-full sm:w-auto sm:min-w-[280px]">
        <span className="material-symbols-outlined text-[20px] text-slate-400">search</span>
        <input
          type="text"
          placeholder="Search MAC, IP, hostname, employee..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function DeviceStatusPill({ device }: { device: GatewayDevice }) {
  const tone = device.blocked ? "danger" : device.authenticated ? "success" : "neutral";
  return <StatusBadge tone={tone}>{device.blocked ? "Blocked" : device.authenticated ? "Online" : "Pending"}</StatusBadge>;
}

function DeviceCards({
  filteredDevices,
  selectedDevice,
  searchQuery,
  setSelectedDevice,
}: Pick<AdminDevicesState, "filteredDevices" | "selectedDevice" | "searchQuery" | "setSelectedDevice">) {
  return (
    <div className="md:hidden space-y-3">
      {filteredDevices.map((device) => {
        const isSelected = selectedDevice?.mac === device.mac;
        return (
          <button
            key={device.mac}
            type="button"
            onClick={() => setSelectedDevice(device)}
            className={`w-full text-left surface-card p-4 transition-colors ${
              isSelected
                ? "ring-primary-300 dark:ring-primary-700 bg-primary-50/60 dark:bg-primary-900/10"
                : "ring-slate-200/60 dark:ring-slate-700/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {device.hostname || "Unknown Device"}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate">{device.mac}</p>
              </div>
              <DeviceStatusPill device={device} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {device.employee_id ? (
                  <EmployeeLink employeeId={device.employee_id}>
                    {device.full_name || device.employee_code || `Employee #${device.employee_id}`}
                  </EmployeeLink>
                ) : (
                  "Unassigned"
                )}
              </p>
              <p className="text-xs text-slate-500 font-mono">{device.ip}</p>
            </div>
          </button>
        );
      })}
      {filteredDevices.length === 0 && (
        <div className="surface-card px-5 py-12 text-center">
          <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600">
            {searchQuery ? "search_off" : "router"}
          </span>
          <p className="text-sm text-slate-400 mt-2">
            {searchQuery ? "No devices match your search" : "No devices connected"}
          </p>
        </div>
      )}
    </div>
  );
}

function DevicesTable({
  filteredDevices,
  selectedDevice,
  searchQuery,
  setSelectedDevice,
  disconnectMutation,
  blockMutation,
  unblockMutation,
}: Pick<AdminDevicesState, "filteredDevices" | "selectedDevice" | "searchQuery" | "setSelectedDevice" | "disconnectMutation" | "blockMutation" | "unblockMutation">) {
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="hidden md:block surface-card flex-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              {["Device", "Assigned User", "IP Address", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-800/50 ${
                    h === "Actions" ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredDevices.map((device) => {
              const isSelected = selectedDevice?.mac === device.mac;
              return (
                <tr
                  key={device.mac}
                  onClick={() => setSelectedDevice(device)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary-50/60 dark:bg-primary-900/10 border-l-[3px] border-l-primary-600"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-700/30 border-l-[3px] border-l-transparent"
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{device.hostname || "Unknown Device"}</p>
                    <p className="text-xs text-slate-400 font-mono">{device.mac}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                    {device.employee_id ? (
                      <EmployeeLink employeeId={device.employee_id}>
                        {device.full_name || device.employee_code || `Employee #${device.employee_id}`}
                      </EmployeeLink>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{device.ip}</td>
                  <td className="px-5 py-3.5">
                    <DeviceStatusPill device={device} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {device.authenticated && !device.blocked && (
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          title="Disconnect"
                          onClick={(e) => { stop(e); disconnectMutation.mutate(device.mac); }}
                        >
                          <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                        </button>
                      )}
                      {device.blocked ? (
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          title="Unblock"
                          onClick={(e) => { stop(e); unblockMutation.mutate(device.mac); }}
                        >
                          <span className="material-symbols-outlined text-[18px]">lock_open</span>
                        </button>
                      ) : (
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title="Block"
                          onClick={(e) => { stop(e); blockMutation.mutate(device.mac); }}
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600">
                    {searchQuery ? "search_off" : "router"}
                  </span>
                  <p className="text-sm text-slate-400 mt-2">
                    {searchQuery ? "No devices match your search" : "No devices connected"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeviceDetailPanel({
  selectedDevice,
  sessions,
  setSelectedDevice,
  disconnectMutation,
  blockMutation,
  unblockMutation,
  deleteMutation,
}: Pick<AdminDevicesState, "selectedDevice" | "sessions" | "setSelectedDevice" | "disconnectMutation" | "blockMutation" | "unblockMutation" | "deleteMutation">) {
  if (!selectedDevice) return null;

  return (
    <div className="w-full xl:w-96 shrink-0 surface-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {selectedDevice.hostname || "Unknown Device"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  selectedDevice.blocked ? "bg-rose-500" : selectedDevice.authenticated ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {selectedDevice.blocked ? "Blocked" : selectedDevice.authenticated ? "Online" : "Offline"}
            </div>
          </div>
          <button
            onClick={() => setSelectedDevice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "MAC Address", value: selectedDevice.mac },
            { label: "IP Address", value: selectedDevice.ip },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{item.value}</p>
            </div>
          ))}
        </div>

        {selectedDevice.employee_id && (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Assigned User</p>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  {selectedDevice.full_name?.charAt(0) || "?"}
                </span>
              </div>
              <div>
                {selectedDevice.employee_id ? (
                  <EmployeeLink employeeId={selectedDevice.employee_id} className="text-sm font-medium">
                    {selectedDevice.full_name || "Unknown"}
                  </EmployeeLink>
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedDevice.full_name || "Unknown"}</p>
                )}
                <p className="text-xs text-slate-400">{selectedDevice.employee_code}</p>
              </div>
            </div>
          </div>
        )}

        {selectedDevice.employee_id && (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Recent Sessions</p>
            {Array.isArray(sessions) && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s: any, i: number) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">{s.ip_address || s.ip || "—"}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          s.is_active
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        {s.is_active ? "Active" : "Ended"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No sessions found</p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-40"
            onClick={() => disconnectMutation.mutate(selectedDevice.mac)}
            disabled={!selectedDevice.authenticated || selectedDevice.blocked || disconnectMutation.isPending}
          >
            <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
            Disconnect
          </button>
          <button
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-40"
            onClick={() => {
              if (selectedDevice.device_id && confirm(`Permanently delete ${selectedDevice.mac}?`))
                deleteMutation.mutate(selectedDevice.device_id);
            }}
            disabled={!selectedDevice.device_id || deleteMutation.isPending}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </button>
        </div>
        {selectedDevice.blocked ? (
          <button
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-40"
            onClick={() => unblockMutation.mutate(selectedDevice.mac)}
            disabled={unblockMutation.isPending}
          >
            <span className="material-symbols-outlined text-[16px]">lock_open</span>
            Unblock Device
          </button>
        ) : (
          <button
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-40"
            onClick={() => blockMutation.mutate(selectedDevice.mac)}
            disabled={blockMutation.isPending}
          >
            <span className="material-symbols-outlined text-[16px]">block</span>
            Block Device
          </button>
        )}
      </div>
    </div>
  );
}

function GatewayLogs({
  showLogs,
  logs,
  refetchLogs,
  setShowLogs,
}: Pick<AdminDevicesState, "showLogs" | "logs" | "refetchLogs" | "setShowLogs">) {
  if (!showLogs) return null;

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary-600 dark:text-primary-400">terminal</span>
          Gateway Logs
        </h3>
        <div className="flex gap-2">
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            onClick={() => refetchLogs()}
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={() => setShowLogs(false)}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-auto p-4 bg-slate-900 font-mono text-xs leading-relaxed text-slate-400">
        {Array.isArray(logs) && logs.length > 0 ? (
          logs.map((line: string, i: number) => (
            <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
          ))
        ) : (
          <p className="text-slate-600 text-center py-8">No logs available</p>
        )}
      </div>
    </div>
  );
}

export function AdminDevicesView(state: AdminDevicesState) {
  if (!gatewayAdminEnabled) {
    return <GatewayAdminDisabled />;
  }

  return (
    <div className="space-y-6">
      <DeviceToast toast={state.toast} />
      <DevicesHeader {...state} />
      <DeviceErrorBanner {...state} />
      <DeviceStats stats={state.stats} />
      <DeviceFilters {...state} />

      <div className="flex flex-col xl:flex-row gap-6" style={{ minHeight: 400 }}>
        <DeviceCards {...state} />
        <DevicesTable {...state} />
        <DeviceDetailPanel {...state} />
      </div>

      <GatewayLogs {...state} />
    </div>
  );
}
