/**
 * Devices Page — manage employee devices via /api/v1/devices/
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { Device } from "../lib/types";
import { RegisterDeviceModal } from "../components/RegisterDeviceModal";

export function DevicesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const employeeId = user?.employee_id ?? 0;
  const [showRegister, setShowRegister] = useState(false);

  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices", employeeId],
    queryFn: () => devicesApi.getForEmployee(employeeId).then((r) => r.data),
    enabled: employeeId > 0,
  });

  const blockMutation = useMutation({
    mutationFn: (deviceId: number) => devicesApi.block(deviceId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["devices", employeeId] }),
  });

  const unblockMutation = useMutation({
    mutationFn: (deviceId: number) => devicesApi.unblock(deviceId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["devices", employeeId] }),
  });

  const deviceIcon = (type: string) => {
    if (type === "mobile") return "smartphone";
    if (type === "tablet") return "tablet";
    return "laptop";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-blue-500">devices</span>
            My Devices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your registered devices
          </p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-10 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-2"
          onClick={() => setShowRegister(true)}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Register Device
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Table */}
      {!isLoading && Array.isArray(devices) && devices.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  {["Device Name", "Type", "MAC Address", "IP Address", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-800/50"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {devices.map((device: Device) => (
                  <tr key={device.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`material-symbols-outlined text-[20px] ${
                            device.is_blocked
                              ? "text-rose-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {deviceIcon(device.device_type)}
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{device.device_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300 capitalize">
                      {device.device_type}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                      {device.mac_address}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                      {device.ip_address || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          device.is_blocked
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${device.is_blocked ? "bg-rose-500" : "bg-emerald-500"}`} />
                        {device.is_blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {device.is_blocked ? (
                        <button
                          className="text-xs font-medium px-3 py-1.5 rounded-lg ring-1 ring-slate-200 dark:ring-slate-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-40"
                          onClick={() => unblockMutation.mutate(device.id)}
                          disabled={unblockMutation.isPending}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          className="text-xs font-medium px-3 py-1.5 rounded-lg ring-1 ring-slate-200 dark:ring-slate-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-40"
                          onClick={() => blockMutation.mutate(device.id)}
                          disabled={blockMutation.isPending}
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!devices || (Array.isArray(devices) && devices.length === 0)) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 text-center py-16">
          <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">devices</span>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-3">No devices registered</p>
          <button
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
            onClick={() => setShowRegister(true)}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Register your first device
          </button>
        </div>
      )}

      {showRegister && (
        <RegisterDeviceModal
          onClose={() => setShowRegister(false)}
          onRegistered={() => {
            setShowRegister(false);
            queryClient.invalidateQueries({
              queryKey: ["devices", employeeId],
            });
          }}
        />
      )}
    </div>
  );
}
