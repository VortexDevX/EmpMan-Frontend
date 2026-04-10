// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./contexts/AuthContext";
import { Suspense, lazy, type ReactElement } from "react";
import { getDefaultRoute, type UserRole } from "./lib/routes";

// Layout
const Layout = lazy(() =>
  import("./components/Layout").then((m) => ({ default: m.Layout })),
);

// Auth
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SetupTotpPage = lazy(() =>
  import("./pages/SetupTotpPage").then((m) => ({ default: m.SetupTotpPage })),
);

// Shared Pages
const TasksPage = lazy(() =>
  import("./pages/TasksPage").then((m) => ({ default: m.TasksPage })),
);
const TaskAssignmentPage = lazy(() =>
  import("./pages/TaskAssignmentPage").then((m) => ({ default: m.TaskAssignmentPage })),
);
const SurveyPage = lazy(() =>
  import("./pages/SurveyPage").then((m) => ({ default: m.SurveyPage })),
);
const HolidaysPage = lazy(() =>
  import("./pages/HolidaysPage").then((m) => ({ default: m.HolidaysPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const HelpPage = lazy(() =>
  import("./pages/HelpPage").then((m) => ({ default: m.HelpPage })),
);
const RecommendationsPage = lazy(() =>
  import("./pages/RecommendationsPage").then((m) => ({ default: m.RecommendationsPage })),
);
const EmployeeDetailsPage = lazy(() =>
  import("./pages/EmployeeDetailsPage").then((m) => ({ default: m.EmployeeDetailsPage })),
);
const AttendancePage = lazy(() =>
  import("./pages/AttendancePage").then((m) => ({ default: m.AttendancePage })),
);
const LeavePage = lazy(() =>
  import("./pages/LeavePage").then((m) => ({ default: m.LeavePage })),
);
const ApprovalInboxPage = lazy(() =>
  import("./pages/ApprovalInboxPage").then((m) => ({ default: m.ApprovalInboxPage })),
);

// Management Pages
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);

// Admin Pages
const AdminDevicesPage = lazy(() =>
  import("./pages/admin/DevicesPage").then((m) => ({ default: m.AdminDevicesPage })),
);
const AdminEmployeesPage = lazy(() =>
  import("./pages/admin/EmployeesPage").then((m) => ({ default: m.AdminEmployeesPage })),
);
const CreateEmployeePage = lazy(() =>
  import("./pages/admin/CreateEmployeePage").then((m) => ({ default: m.CreateEmployeePage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Don't retry on auth errors (401/403) — they won't succeed
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        // Avoid duplicate noisy retries for auth/permission/not-found client errors.
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
    },
  },
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Route guard with role-based access control.
 * Redirects to login if unauthenticated, to TOTP setup if needed,
 * or to the user's default route if role is insufficient.
 */
function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactElement;
  roles?: string[];
}) {
  const { isAuthenticated, isLoading, user, needsTotpSetup } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force TOTP setup if needed (but don't redirect if already on setup page)
  if (needsTotpSetup && location.pathname !== "/setup-totp") {
    return <Navigate to="/setup-totp" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const defaultRoute = getDefaultRoute(user.role as UserRole);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, user, isLoading, needsTotpSetup } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  const defaultRoute = user
    ? getDefaultRoute(user.role as UserRole)
    : "/login";

  return (
    <Routes>
      {/* ─── Public: Login ─────────────────────────────── */}
      <Route
        path="/login"
        element={
          isAuthenticated && !needsTotpSetup
            ? <Navigate to={defaultRoute} replace />
            : <LoginPage />
        }
      />

      {/* ─── TOTP Setup (authenticated but no TOTP) ──── */}
      <Route
        path="/setup-totp"
        element={<SetupTotpPage />}
      />

      {/* ─── Authenticated Routes ──────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Index redirect */}
        <Route index element={<Navigate to={defaultRoute} replace />} />

        {/* ── All Roles ──────────────────────────────── */}
        <Route
          path="dashboard"
          element={<DashboardPage />}
        />
        <Route
          path="tasks"
          element={
            <ProtectedRoute roles={["employee", "manager"]}>
              <TasksPage />
            </ProtectedRoute>
          }
        />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="surveys" element={<SurveyPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="insights" element={<RecommendationsPage />} />
        <Route path="employees/:id" element={<EmployeeDetailsPage />} />

        {/* ── Manager + Admin ────────────────────────── */}
        <Route
          path="tasks/assign"
          element={
            <ProtectedRoute roles={["manager", "admin"]}>
              <TaskAssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/employees"
          element={
            <ProtectedRoute roles={["manager", "admin"]}>
              <AdminEmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/employees/new"
          element={
            <ProtectedRoute roles={["manager", "admin"]}>
              <CreateEmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="approvals"
          element={
            <ProtectedRoute roles={["manager", "admin"]}>
              <ApprovalInboxPage />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Only ─────────────────────────────── */}
        <Route
          path="admin/devices"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDevicesPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ─── SSO Callback ──────────────────────────────── */}
      <Route
        path="/auth/callback"
        element={
          isLoading ? <LoadingSpinner /> :
          isAuthenticated ? <Navigate to={defaultRoute} replace /> :
          <Navigate to="/login" replace />
        }
      />

      {/* ─── Catch-all ──────────────────────────────────── */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  const routerBase = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1) || "/"
    : import.meta.env.BASE_URL;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        basename={routerBase}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
