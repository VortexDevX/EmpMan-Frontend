import { EmployeeActionsModal } from "./EmployeeActionsModal";
import { EmployeesErrorState } from "./EmployeesErrorState";
import { EmployeesFilters } from "./EmployeesFilters";
import { EmployeesHeader } from "./EmployeesHeader";
import { EmployeesStats } from "./EmployeesStats";
import { EmployeesTable } from "./EmployeesTable";
import type { AdminEmployeesState } from "./types";
import { FormAlert } from "../../components/ui/FormLayout";
import { getApiErrorMessage } from "../../lib/errors";

export function AdminEmployeesView({
  canManage,
  searchQuery,
  showInactive,
  selectedEmployee,
  filteredEmployees,
  stats,
  isLoading,
  isError,
  errorStatus,
  errorDetail,
  setSearchQuery,
  setShowInactive,
  setSelectedEmployee,
  navigate,
  roleBadge,
  toggleActiveMutation,
  deleteMutation,
}: AdminEmployeesState) {
  if (isError) {
    return <EmployeesErrorState errorStatus={errorStatus} errorDetail={errorDetail} />;
  }

  return (
    <div className="space-y-6">
      {(toggleActiveMutation.error || deleteMutation.error) && (
        <FormAlert tone="error">
          {getApiErrorMessage(
            toggleActiveMutation.error || deleteMutation.error,
            "The employee action could not be completed.",
          )}
        </FormAlert>
      )}
      <EmployeesHeader navigate={navigate} canManage={canManage} />
      <EmployeesStats stats={stats} />
      <EmployeesFilters
        searchQuery={searchQuery}
        showInactive={showInactive}
        setSearchQuery={setSearchQuery}
        setShowInactive={setShowInactive}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16" role="status" aria-label="Loading employees">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true" />
        </div>
      )}

      {!isLoading && !isError && (
        <EmployeesTable
          filteredEmployees={filteredEmployees}
          searchQuery={searchQuery}
          navigate={navigate}
          roleBadge={roleBadge}
          onToggleActive={(employee) => toggleActiveMutation.mutate(employee)}
          canManage={canManage}
        />
      )}

      {canManage && <EmployeeActionsModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        navigate={navigate}
        onToggleActive={(employee) => toggleActiveMutation.mutate(employee)}
        onDelete={(id) => deleteMutation.mutate(id)}
        togglePending={toggleActiveMutation.isPending}
        deletePending={deleteMutation.isPending}
      />}
    </div>
  );
}
