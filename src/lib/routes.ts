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
  sidebarOrder?: number;
}

// ─── Route Definitions ──────────────────────────────────────
export const ROUTES: RouteConfig[] = [
  // Main (all authenticated users) — highest priority first
  { path: "/dashboard", label: "Dashboard",    icon: "dashboard",      roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 10 },
  { path: "/insights",  label: "Insights",     icon: "insights",       roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 20 },
  { path: "/attendance",label: "Attendance",   icon: "fact_check",     roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 30 },
  { path: "/leave",     label: "Leave",        icon: "event_available",roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 40 },
  { path: "/tasks",     label: "My Tasks",     icon: "task_alt",       roles: ["employee", "manager"], showInSidebar: true, group: "main", sidebarOrder: 50 },
  { path: "/surveys",   label: "Surveys",      icon: "poll",           roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 60 },
  { path: "/holidays",  label: "Holidays",     icon: "event",          roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 70 },
  { path: "/profile",   label: "Profile",      icon: "person",         roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 80 },
  { path: "/settings",  label: "Settings",     icon: "settings",       roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 90 },
  { path: "/help",      label: "Help",         icon: "help_outline",   roles: ["employee", "manager", "admin"], showInSidebar: true, group: "main", sidebarOrder: 100 },
  { path: "/employees", label: "Employee Details", icon: "badge",       roles: ["employee", "manager", "admin"], showInSidebar: false },

  // Management (manager + admin)
  { path: "/admin/employees",    label: "Employees",       icon: "group",            roles: ["manager", "admin"], showInSidebar: true, group: "management", sidebarOrder: 10 },
  { path: "/tasks/assign",       label: "Assign Task",     icon: "assignment_add",   roles: ["manager", "admin"], showInSidebar: true, group: "management", sidebarOrder: 20 },
  { path: "/approvals",          label: "Approvals",       icon: "approval_delegation", roles: ["manager", "admin"], showInSidebar: true, group: "management", sidebarOrder: 30 },
  { path: "/admin/employees/new",label: "Create Employee", icon: "person_add",       roles: ["manager", "admin"], showInSidebar: false },

  // Administration (admin only)
  { path: "/admin/devices",      label: "Gateway Devices", icon: "router",           roles: ["admin"], showInSidebar: true, group: "admin", sidebarOrder: 10 },
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

  for (const group of Object.values(groups)) {
    group.routes.sort((a, b) => {
      const aOrder = a.sidebarOrder ?? 999;
      const bOrder = b.sidebarOrder ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.label.localeCompare(b.label);
    });
  }

  return groups;
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const route = ROUTES.find((r) => r.path === path);
  if (!route) return true; // unknown routes handled by catch-all
  return route.roles.includes(role);
}
