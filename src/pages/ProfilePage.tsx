// src/pages/ProfilePage.tsx
import { useQuery } from "@tanstack/react-query";
import { employeesApi, departmentsApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageLoader } from "../components/ui/LoadingSpinner";

export function ProfilePage() {
  const { user } = useAuth();

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ["employee", user?.employee_id],
    queryFn: () => employeesApi.get(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", user?.employee_id],
    queryFn: async () => {
      try {
        const res = await employeesApi.getProfile(user!.employee_id);
        return res.data;
      } catch (err: any) {
        // Some employees may not have a profile yet.
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user?.employee_id,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const getDeptName = (deptId: number) => {
    if (!Array.isArray(departments)) return `Department #${deptId}`;
    const dept = departments.find((d: any) => d.id === deptId);
    return dept?.name || `Department #${deptId}`;
  };

  if (loadingEmployee || loadingProfile) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          View your account information
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {user?.full_name?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {user?.full_name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">{user?.employee_code}</p>
            <Badge variant="info">{user?.role}</Badge>
          </div>
        </div>

        {employee && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
              <Badge variant={employee.is_active ? "success" : "danger"}>
                {employee.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Member Since</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(employee.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Last Login</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {employee.last_login
                  ? new Date(employee.last_login).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        )}

        {profile && (
          <>
            <hr className="my-6 border-slate-200 dark:border-slate-700" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Department</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {getDeptName(profile.department_id)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Job Title</p>
                <p className="font-medium text-slate-900 dark:text-white">{profile.job_title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Job Level</p>
                <p className="font-medium text-slate-900 dark:text-white">{profile.job_level}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Joining Date</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {new Date(profile.joining_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
