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
    <header className="border-b border-border-strong bg-bg-base">
      <div className="mx-auto max-w-6xl px-8">
        {/* 매거진 마스트헤드 */}
        <div className="flex h-14 items-center justify-between">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="serif text-xl font-bold tracking-tight">FinCoach</span>
            <span className="caption hidden sm:inline">금융 학습 매거진</span>
          </NavLink>
          <ThemeToggle />
        </div>
        <nav className="flex h-10 items-end gap-7 border-t border-border pt-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "serif relative pb-2 text-[15px] transition",
                  isActive
                    ? "font-medium text-fg-primary after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-accent"
                    : "font-normal text-fg-secondary hover:text-fg-primary",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
