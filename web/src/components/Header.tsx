import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";

const nav = [
  { to: "/", label: "홈" },
  { to: "/portfolio", label: "내 자산" },
  { to: "/chat", label: "AI 코치" },
  { to: "/learn", label: "용어 사전" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg-base/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-base font-semibold tracking-tight">
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
                    "rounded-sm px-3 py-1.5 text-sm transition",
                    isActive
                      ? "bg-accent-soft font-medium text-fg-primary"
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
