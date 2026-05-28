import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";

const nav = [
  { to: "/", label: "대시보드" },
  { to: "/portfolio", label: "포트폴리오" },
  { to: "/chat", label: "Q&A" },
  { to: "/learn", label: "학습" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg-base/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-base font-semibold tracking-tight">
            FinCoach
          </NavLink>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-sm px-3 py-1.5 text-sm transition",
                    isActive
                      ? "bg-bg-muted text-fg-primary"
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
