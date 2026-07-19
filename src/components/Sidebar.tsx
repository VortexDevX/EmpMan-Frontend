// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { getSidebarGroups, type UserRole } from "../lib/routes";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;
  const groups = getSidebarGroups(user.role as UserRole);
  const groupOrder = ["main", "management", "admin"];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 md:hidden transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`w-64 lg:w-72 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-40 md:z-30 transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo / Brand */}
        <div className="h-[72px] px-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="h-10 w-10 rounded-lg bg-primary-700 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-[22px]">monitoring</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-slate-900 dark:text-white truncate section-title">Employee Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role} Workspace</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto md:hidden h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groupOrder.map((groupKey) => {
            const group = groups[groupKey];
            if (!group) return null;

            return (
              <div key={groupKey}>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-3 mb-2">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.routes.map((route) => (
                    <li key={route.path}>
                      <NavLink
                        to={route.path}
                        end={route.path === "/admin"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? "bg-primary-50 dark:bg-primary-900/35 text-primary-800 dark:text-primary-200 shadow-[inset_3px_0_0_#0f766e]"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white"
                          }`
                        }
                      >
                        <span className="material-symbols-outlined text-[22px]">{route.icon}</span>
                        <span className="truncate">{route.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="h-9 w-9 rounded-full bg-white/75 dark:bg-slate-700/75 flex items-center justify-center shrink-0 ring-1 ring-white/30 dark:ring-slate-600/50">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user.full_name || "User"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.employee_code}
              </p>
            </div>
            <button
              onClick={logout}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
