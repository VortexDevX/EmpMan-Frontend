// src/lib/routes.ts
// Centralized route definitions with RBAC

export type UserRole = "admin" | "manager" | "employee";

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
  showInSidebar?: boolean;
  group?: "main" | "management" | "admin";
}

// ─── Route Definitions ──────────────────────────────────────
export const ROUTES: RouteConfig[] = [
  // Main (all authenticated users) — highest priority first
  { path: "/dashboard", label: "Dashboard",    icon: "dashboard",      roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },
  { path: "/tasks",     label: "My Tasks",     icon: "task_alt",       roles: ["employee", "manager"], showInSidebar: true, group: "main" },
  { path: "/surveys",   label: "Surveys",      icon: "poll",           roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },
  { path: "/holidays",  label: "Holidays",     icon: "event",          roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },
  { path: "/profile",   label: "Profile",      icon: "person",         roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },
  { path: "/settings",  label: "Settings",     icon: "settings",       roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },
  { path: "/help",      label: "Help",         icon: "help_outline",   roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },
  { path: "/insights",  label: "Insights",     icon: "insights",       roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main" },

  // Management (manager + admin)
  { path: "/admin/employees",    label: "Employees",       icon: "group",            roles: ["manager", "admin"], showInSidebar: true, group: "management" },
  { path: "/tasks/assign",       label: "Assign Task",     icon: "assignment_add",   roles: ["manager", "admin"], showInSidebar: true, group: "management" },
  { path: "/admin/employees/new",label: "Create Employee", icon: "person_add",       roles: ["manager", "admin"], showInSidebar: false },

  // Administration (admin only)
  { path: "/admin/devices",      label: "Gateway Devices", icon: "router",           roles: ["admin"], showInSidebar: true, group: "admin" },
];

// ─── Helpers ─────────────────────────────────────────────────

export function getDefaultRoute(_role: UserRole): string {
  return "/dashboard";
}

export function getSidebarRoutes(role: UserRole): RouteConfig[] {
  return ROUTES.filter(
    (r) => r.showInSidebar && r.roles.includes(role)
  );
}

export function getSidebarGroups(role: UserRole) {
  const routes = getSidebarRoutes(role);
  const groups: Record<string, { label: string; routes: RouteConfig[] }> = {};

  const groupLabels: Record<string, string> = {
    main: "Main",
    management: "Management",
    admin: "Administration",
  };

  for (const route of routes) {
    const group = route.group || "main";
    if (!groups[group]) {
      groups[group] = { label: groupLabels[group] || group, routes: [] };
    }
    groups[group].routes.push(route);
  }

  return groups;
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const route = ROUTES.find((r) => r.path === path);
  if (!route) return true; // unknown routes handled by catch-all
  return route.roles.includes(role);
}
