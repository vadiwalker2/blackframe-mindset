import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <main className="mx-auto max-w-2xl px-5 pt-14 pb-32 safe-top">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-medium">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
