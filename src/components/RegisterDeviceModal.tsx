/**
 * Register Device Modal — POST /api/v1/devices/
 */
import { useEffect, useRef, useState } from "react";
import { devicesApi } from "../lib/api";
import { useAuth } from "../contexts/useAuth";
import { FormAlert } from "./ui/FormLayout";

interface Props {
  onClose: () => void;
  onRegistered: () => void;
}

export function RegisterDeviceModal({ onClose, onRegistered }: Props) {
  const { user } = useAuth();
  const [deviceName, setDeviceName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [deviceType, setDeviceType] = useState("laptop");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await devicesApi.register({
        employee_id: user!.employee_id,
        mac_address: macAddress,
        ip_address: ipAddress || undefined,
        device_name: deviceName,
        device_type: deviceType,
      });
      onRegistered();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to register device");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "input-shell w-full h-11 px-3.5 text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-device-title"
        className="w-full max-w-md surface-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h2 id="register-device-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary-600 dark:text-primary-400">add_circle</span>
            Register Device
          </h2>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
            type="button"
            aria-label="Close register device dialog"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && <FormAlert tone="error">{error}</FormAlert>}

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="device-name" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Device Name
              </label>
              <input
                type="text"
                id="device-name"
                className={inputClass}
                placeholder="My Laptop"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="mac-address" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                MAC Address
              </label>
              <input
                type="text"
                id="mac-address"
                className={inputClass}
                placeholder="58:1c:f8:f4:c3:d8"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="ip-address" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                IP Address (optional)
              </label>
              <input
                type="text"
                id="ip-address"
                className={inputClass}
                placeholder="192.168.1.100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="device-type" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Device Type
              </label>
              <select
                id="device-type"
                className={inputClass}
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
              >
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="btn-primary flex-1 disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Registering…" : "Register"}
            </button>
            <button
              type="button"
              className="px-5 h-11 rounded-lg text-sm font-medium ring-1 ring-slate-200 dark:ring-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
