import { History, ScanLine, Upload } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { cn } from "../lib/cn";
import ApiStatusBadge from "./ApiStatusBadge";

const links = [
  { to: "/", label: "Upload", icon: Upload, end: true },
  { to: "/result", label: "Result", icon: ScanLine, end: false },
  { to: "/history", label: "History", icon: History, end: false },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <ScanLine className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">FoodLens</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <ApiStatusBadge />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-slate-500 sm:px-6">
          FoodLens scaffold &middot; React + FastAPI + PostgreSQL
        </div>
      </footer>
    </div>
  );
}
