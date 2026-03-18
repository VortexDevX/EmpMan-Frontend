// src/components/Layout.tsx
// Unified layout for all authenticated users (employee, manager, admin)
import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ROUTES } from "../lib/routes";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
    const match = ROUTES
      .filter((route) => currentPath === route.path || currentPath.startsWith(`${route.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (match?.label) return match.label;
    if (location.pathname.includes("/admin")) return "Administration";
    return "Employee Dashboard";
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-72 lg:ml-80 min-h-screen">
        <header className="sticky top-0 z-20 md:hidden glass-panel px-4 h-16 flex items-center gap-3 rounded-none border-x-0 border-t-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/35"
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Employee Dashboard
            </p>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate section-title">{pageTitle}</h1>
          </div>
        </header>
        <main className="min-h-screen">
          <div className="mx-auto w-full max-w-none px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-8 xl:px-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
