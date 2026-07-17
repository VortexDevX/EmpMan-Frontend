import { AdminDevicesView } from "../../features/admin-devices/AdminDevicesView";
import { useAdminDevices } from "../../features/admin-devices/useAdminDevices";

export function AdminDevicesPage() {
  return <AdminDevicesView {...useAdminDevices()} />;
}
