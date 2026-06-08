import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";

const nav = [
  { to: "/", label: "대시보드" },
  { to: "/portfolio", label: "포트폴리오" },
  { to: "/chat", label: "코치" },
  { to: "/learn", label: "학습" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg-base/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <NavLink to="/" className="headline text-xl">
            FinCoach
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-sm px-3 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-accent-soft text-fg-primary"
                      : "text-fg-secondary hover:bg-bg-muted hover:text-fg-primary",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
