// src/components/Layout.tsx
// Unified layout for all authenticated users (employee, manager, admin)
import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ROUTES } from "../lib/routes";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const pageTitle = useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
    const match = ROUTES
      .filter((route) => currentPath === route.path || currentPath.startsWith(`${route.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (match?.label) return match.label;
    if (location.pathname.includes("/admin")) return "Administration";
    return "Employee Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${pageTitle} · Workforce OS`;
    window.scrollTo({ top: 0, behavior: "auto" });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, pageTitle]);

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-64 lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/88 dark:bg-slate-950/88 backdrop-blur-xl px-4 sm:px-7 lg:px-10 h-16 sm:h-[72px] flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden h-10 w-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="min-w-0">
            <p className="page-kicker">
              Workspace
            </p>
            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate section-title">{pageTitle}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Secure session
          </div>
        </header>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="min-h-screen outline-none">
          <div className="mx-auto w-full max-w-none px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-8 xl:px-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
