import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayApi } from "../../lib/api";
import { gatewayAdminEnabled } from "../../lib/deployment";
import type { DeviceTab, DeviceTabKey, GatewayDevice } from "./types";

export function useAdminDevices() {
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<GatewayDevice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<DeviceTabKey>("all");
  const [showLogs, setShowLogs] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

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

  const devices: GatewayDevice[] = data?.devices || [];
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

  const tabs: DeviceTab[] = [
    { key: "all", label: "All Devices", count: devices.length },
    { key: "online", label: "Online", count: stats.online },
    { key: "blocked", label: "Blocked", count: stats.blocked },
  ];

  const errorDetail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;

  return {
    selectedDevice,
    searchQuery,
    activeTab,
    showLogs,
    toast,
    logs,
    sessions,
    filteredDevices,
    stats,
    tabs,
    isLoading,
    isError,
    errorDetail,
    setSelectedDevice,
    setSearchQuery,
    setActiveTab,
    setShowLogs,
    refetch,
    refetchLogs,
    disconnectMutation,
    blockMutation,
    unblockMutation,
    kickAllMutation,
    deleteMutation,
  };
}
