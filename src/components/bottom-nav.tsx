import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Repeat, CheckSquare, BarChart3, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/routines", label: "Routines", icon: Repeat },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      <div className="mx-auto max-w-2xl px-3 pb-2">
        <div className="glass rounded-2xl border border-border/60 px-2 py-2 flex items-center justify-between">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-300 ${
                  active
                    ? "text-foreground bg-secondary/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
