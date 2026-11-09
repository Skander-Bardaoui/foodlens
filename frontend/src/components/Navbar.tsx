import { useQuery } from "@tanstack/react-query";
import { ChefHat, History, ScanLine, Upload } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { fetchHealth } from "../api/client";
import { cn } from "../lib/cn";

const desktopLinks = [
  { to: "/", label: "Analyze", end: true },
  { to: "/history", label: "History", end: false },
];

function isRouteActive(to: string, isActive: boolean, pathname: string): boolean {
  return isActive || (to === "/" && pathname.startsWith("/result"));
}

function ApiDot() {
  const { data, isError, isPending } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const online = !isPending && !isError && data?.status === "ok";
  const label = isPending ? "Checking API" : online ? "API online" : "API unreachable";

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-pill ring-2 ring-surface-lowest",
        isPending && "bg-outline-soft",
        !isPending && online && "bg-accent",
        !isPending && !online && "bg-danger",
      )}
    />
  );
}

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-surface-lowest/90 shadow-header backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/" className="flex items-center gap-2.5" aria-label="FoodLens home">
              <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand text-white shadow-sm">
                <ScanLine className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="font-display text-headline-sm font-bold tracking-tight text-ink">
                FoodLens
              </span>
              <span className="rounded-pill bg-brand-soft px-2 py-0.5 font-body text-label-sm font-semibold uppercase tracking-wide text-brand-deep">
                AI Beta
              </span>
            </Link>

            <nav className="hidden h-16 items-center gap-8 md:flex">
              {desktopLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "flex h-full items-center pb-0.5 font-body text-label-lg transition-colors",
                      isRouteActive(link.to, isActive, pathname)
                        ? "border-b-2 border-brand font-bold text-brand"
                        : "text-muted hover:text-ink",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="hidden items-center gap-2 rounded-pill bg-surface-container px-4 py-2 font-body text-label-md text-ink shadow-sm transition-all hover:bg-surface-container-high sm:inline-flex"
            >
              <Upload className="h-4 w-4 text-brand" />
              Quick Scan
            </NavLink>

            <span
              className="relative flex h-8 w-8 items-center justify-center rounded-pill bg-gradient-to-br from-brand-soft to-surface-container text-brand-deep shadow-sm ring-2 ring-brand/20"
              title="FoodLens guest profile"
            >
              <ChefHat className="h-4 w-4" />
              <ApiDot />
            </span>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface-lowest/95 pb-[env(safe-area-inset-bottom)] shadow-footer backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-3 items-center">
          {desktopLinks.slice(0, 1).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 font-body text-label-sm",
                  isRouteActive(link.to, isActive, pathname)
                    ? "font-semibold text-brand"
                    : "text-muted-soft",
                )
              }
            >
              <ScanLine className="h-5 w-5" />
              Analyze
            </NavLink>
          ))}

          <div className="flex justify-center">
            <NavLink
              to="/"
              aria-label="Quick scan"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-pill bg-brand text-white shadow-floating ring-4 ring-surface-lowest transition-transform hover:scale-105 active:scale-95"
            >
              <Upload className="h-6 w-6" />
            </NavLink>
          </div>

          {desktopLinks.slice(1).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 font-body text-label-sm",
                  isRouteActive(link.to, isActive, pathname)
                    ? "font-semibold text-brand"
                    : "text-muted-soft",
                )
              }
            >
              <History className="h-5 w-5" />
              History
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
