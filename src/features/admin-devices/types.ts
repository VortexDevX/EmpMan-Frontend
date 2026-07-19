import type { UseMutationResult } from "@tanstack/react-query";
import type { NetworkSession } from "../../lib/types";

export interface GatewayDevice {
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

export type DeviceTabKey = "all" | "online" | "blocked";

export interface DeviceStats {
  total: number;
  online: number;
  blocked: number;
}

export interface DeviceTab {
  key: DeviceTabKey;
  label: string;
  count: number;
}

export interface AdminDevicesState {
  selectedDevice: GatewayDevice | null;
  searchQuery: string;
  activeTab: DeviceTabKey;
  showLogs: boolean;
  toast: { type: "success" | "error"; text: string } | null;
  logs: string[] | undefined;
  sessions: NetworkSession[] | undefined;
  filteredDevices: GatewayDevice[];
  stats: DeviceStats;
  tabs: DeviceTab[];
  isLoading: boolean;
  isError: boolean;
  errorDetail?: string;
  setSelectedDevice: (device: GatewayDevice | null) => void;
  setSearchQuery: (value: string) => void;
  setActiveTab: (tab: DeviceTabKey) => void;
  setShowLogs: (value: boolean) => void;
  refetch: () => void;
  refetchLogs: () => void;
  disconnectMutation: UseMutationResult<unknown, Error, string, unknown>;
  blockMutation: UseMutationResult<unknown, Error, string, unknown>;
  unblockMutation: UseMutationResult<unknown, Error, string, unknown>;
  kickAllMutation: UseMutationResult<unknown, Error, void, unknown>;
  deleteMutation: UseMutationResult<unknown, Error, number, unknown>;
}
