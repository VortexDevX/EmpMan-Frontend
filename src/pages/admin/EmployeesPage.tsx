import { AdminEmployeesView } from "../../features/admin-employees/AdminEmployeesView";
import { useAdminEmployees } from "../../features/admin-employees/useAdminEmployees";

export function AdminEmployeesPage() {
  return <AdminEmployeesView {...useAdminEmployees()} />;
}
