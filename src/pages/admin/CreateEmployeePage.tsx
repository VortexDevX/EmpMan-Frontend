import { CreateEmployeeForm } from "../../features/admin-create-employee/CreateEmployeeForm";
import { CreateEmployeeSuccess } from "../../features/admin-create-employee/CreateEmployeeSuccess";
import { useCreateEmployee } from "../../features/admin-create-employee/useCreateEmployee";

export function CreateEmployeePage() {
  const form = useCreateEmployee();

  if (form.createdCredentials) {
    return <CreateEmployeeSuccess {...form} />;
  }

  return <CreateEmployeeForm {...form} />;
}
