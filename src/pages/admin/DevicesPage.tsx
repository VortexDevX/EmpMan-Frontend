// src/pages/admin/DevicesPage.tsx
import { useState, type MouseEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gatewayApi } from "../../lib/api";
import { gatewayAdminEnabled } from "../../lib/deployment";

interface Device {
  mac: string;
  ip: string;
  hostname: string;
  authenticated: boolean;
  blocked: boolean;
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  device_id?: number;
}

type TabKey = "all" | "online" | "blocked";

export function AdminDevicesPage() {
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showLogs, setShowLogs] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Queries ───────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "connected"],
    queryFn: async () => {
      const res = await gatewayApi.getConnected();
      return res.data?.data;
    },
    enabled: gatewayAdminEnabled,
    refetchInterval: (query) => (query.state.error ? false : 10000),
  });

  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: async () => {
      const res = await gatewayApi.getLogs(100);
      return res.data?.data?.logs || res.data?.logs || [];
    },
    enabled: gatewayAdminEnabled && showLogs,
    refetchInterval: showLogs ? ((query) => (query.state.error ? false : 15000)) : false,
  });

  const { data: sessions } = useQuery({
    queryKey: ["admin", "sessions", selectedDevice?.employee_id],
    queryFn: async () => {
      const res = await gatewayApi.getEmployeeSessions(selectedDevice!.employee_id!);
      return res.data?.data || res.data || [];
    },
    enabled: gatewayAdminEnabled && !!selectedDevice?.employee_id,
  });

  if (!gatewayAdminEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 section-title">
            <span className="material-symbols-outlined text-[24px] text-blue-500">router</span>
            Gateway Devices
          </h1>
        </div>
        <div className="glass-panel rounded-xl p-6 border border-amber-200/60 dark:border-amber-800/40">
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

  // ─── Mutations ─────────────────────────────────────────────
  const invalidateDevices = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "connected"] });

  const disconnectMutation = useMutation({
    mutationFn: (mac: string) => gatewayApi.disconnect(mac),
    onSuccess: () => { invalidateDevices(); showToast("success", "Device disconnected."); },
    onError: () => showToast("error", "Failed to disconnect device."),
  });

  const blockMutation = useMutation({
    mutationFn: (mac: string) => gatewayApi.block(mac),
    onSuccess: () => { invalidateDevices(); showToast("success", "Device blocked."); setSelectedDevice(null); },
    onError: () => showToast("error", "Failed to block device."),
  });

  const unblockMutation = useMutation({
    mutationFn: (mac: string) => gatewayApi.unblock(mac),
    onSuccess: () => { invalidateDevices(); showToast("success", "Device unblocked."); },
    onError: () => showToast("error", "Failed to unblock device."),
  });

  const kickAllMutation = useMutation({
    mutationFn: () => gatewayApi.kickAll(),
    onSuccess: () => { invalidateDevices(); showToast("success", "All devices disconnected."); },
    onError: () => showToast("error", "Failed to kick all devices."),
  });

  const deleteMutation = useMutation({
    mutationFn: (deviceId: number) => gatewayApi.deleteDevice(deviceId),
    onSuccess: () => { invalidateDevices(); showToast("success", "Device deleted."); setSelectedDevice(null); },
    onError: () => showToast("error", "Failed to delete device."),
  });

  // ─── Derived Data ──────────────────────────────────────────
  const devices: Device[] = data?.devices || [];
  const blockedMacs: string[] = data?.blocked_macs || [];

  const tabFiltered = devices.filter((d) => {
    if (activeTab === "online") return d.authenticated && !d.blocked;
    if (activeTab === "blocked") return d.blocked;
    return true;
  });

  const filteredDevices = tabFiltered.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.mac.toLowerCase().includes(q) ||
      d.ip.includes(q) ||
      (d.hostname?.toLowerCase() || "").includes(q) ||
      (d.employee_code?.toLowerCase() || "").includes(q) ||
      (d.full_name?.toLowerCase() || "").includes(q)
    );
  });

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.authenticated && !d.blocked).length,
    blocked: blockedMacs.length,
  };
  const errorDetail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;

  const stop = (e: MouseEvent) => e.stopPropagation();

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All Devices", count: devices.length },
    { key: "online", label: "Online", count: stats.online },
    { key: "blocked", label: "Blocked", count: stats.blocked },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl font-semibold text-sm text-white shadow-lg flex items-center gap-2 animate-in fade-in ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-blue-500">router</span>
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

      {/* Stats */}
      {isError && (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5">error</span>
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Could not fetch live gateway devices</p>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">
              {typeof errorDetail === "string" ? errorDetail : "Check that the local Pi-Gateway API is running and authenticated."}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { label: "Online", value: stats.online, icon: "wifi", colorBg: "bg-emerald-50 dark:bg-emerald-900/20", colorText: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Devices", value: stats.total, icon: "dns", colorBg: "bg-blue-50 dark:bg-blue-900/20", colorText: "text-blue-600 dark:text-blue-400" },
          { label: "Blocked", value: stats.blocked, icon: "block", colorBg: "bg-rose-50 dark:bg-rose-900/20", colorText: "text-rose-600 dark:text-rose-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-lg ${s.colorBg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[22px] ${s.colorText}`}>{s.icon}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
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
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
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

      {/* Table + Detail Panel */}
      <div className="flex flex-col xl:flex-row gap-6" style={{ minHeight: 400 }}>
        {/* Mobile device cards */}
        <div className="md:hidden space-y-3">
          {filteredDevices.map((device) => {
            const isSelected = selectedDevice?.mac === device.mac;
            return (
              <button
                key={device.mac}
                type="button"
                onClick={() => setSelectedDevice(device)}
                className={`w-full text-left bg-white dark:bg-slate-800 rounded-xl ring-1 p-4 transition-colors ${
                  isSelected
                    ? "ring-blue-300 dark:ring-blue-700 bg-blue-50/50 dark:bg-blue-900/10"
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
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      device.blocked
                        ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                        : device.authenticated
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${device.blocked ? "bg-rose-500" : device.authenticated ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {device.blocked ? "Blocked" : device.authenticated ? "Online" : "Pending"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {device.full_name || device.employee_code || "Unassigned"}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{device.ip}</p>
                </div>
              </button>
            );
          })}
          {filteredDevices.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 px-5 py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600">
                {searchQuery ? "search_off" : "router"}
              </span>
              <p className="text-sm text-slate-400 mt-2">
                {searchQuery ? "No devices match your search" : "No devices connected"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 flex-1 overflow-hidden">
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
                          ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-[3px] border-l-blue-500"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-700/30 border-l-[3px] border-l-transparent"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{device.hostname || "Unknown Device"}</p>
                        <p className="text-xs text-slate-400 font-mono">{device.mac}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                        {device.full_name || device.employee_code || (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{device.ip}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            device.blocked
                              ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                              : device.authenticated
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${device.blocked ? "bg-rose-500" : device.authenticated ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {device.blocked ? "Blocked" : device.authenticated ? "Online" : "Pending"}
                        </span>
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

        {/* Detail Panel */}
        {selectedDevice && (
          <div className="w-full xl:w-96 shrink-0 bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 flex flex-col overflow-hidden">
            {/* Panel Header */}
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

            {/* Panel Body */}
            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Network Info */}
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

              {/* Assigned User */}
              {selectedDevice.employee_id && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Assigned User</p>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {selectedDevice.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedDevice.full_name || "Unknown"}</p>
                      <p className="text-xs text-slate-400">{selectedDevice.employee_code}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
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

            {/* Panel Footer */}
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
        )}
      </div>

      {/* Gateway Logs */}
      {showLogs && (
        <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-500">terminal</span>
              Gateway Logs
            </h3>
            <div className="flex gap-2">
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
      )}
    </div>
  );
}
