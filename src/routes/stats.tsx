import { createFileRoute } from "@tanstack/react-router";
import { Flame, TrendingUp, Target, CheckCircle2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Blackframe" },
      { name: "description", content: "Weekly performance, streak analytics, routine vs task completion." },
    ],
  }),
  component: StatsPage,
});

const WEEK = [
  { day: "Mon", routines: 92, tasks: 70 },
  { day: "Tue", routines: 100, tasks: 85 },
  { day: "Wed", routines: 78, tasks: 60 },
  { day: "Thu", routines: 95, tasks: 90 },
  { day: "Fri", routines: 100, tasks: 100 },
  { day: "Sat", routines: 60, tasks: 50 },
  { day: "Sun", routines: 80, tasks: 65 },
];

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Flame; label: string; value: string; sub?: string }) {
  return (
    <div className="glass border border-border/60 rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-[11px] uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StatsPage() {
  const maxBar = 100;
  return (
    <AppShell>
      <PageHeader
        eyebrow="This week"
        title="Statistics"
        subtitle="Patterns become identity. Watch yours."
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Flame} label="Longest streak" value="31" sub="Read 20 pages" />
        <StatCard icon={TrendingUp} label="Weekly avg" value="86%" sub="+8% vs last week" />
        <StatCard icon={Target} label="Routines done" value="29/35" sub="This week" />
        <StatCard icon={CheckCircle2} label="Tasks closed" value="18" sub="This week" />
      </div>

      <section className="glass border border-border/60 rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Completion</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground" />Routines</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" />Tasks</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {WEEK.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center gap-1 items-end h-32">
                <div
                  className="w-2.5 rounded-t bg-foreground transition-all duration-500"
                  style={{ height: `${(d.routines / maxBar) * 100}%` }}
                />
                <div
                  className="w-2.5 rounded-t bg-muted-foreground/50 transition-all duration-500"
                  style={{ height: `${(d.tasks / maxBar) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass border border-border/60 rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Top routines</h2>
        <ul className="space-y-3">
          {[
            { name: "Read 20 pages", pct: 100 },
            { name: "Cold shower", pct: 95 },
            { name: "Deep work — 90 min", pct: 88 },
            { name: "Train", pct: 72 },
            { name: "Plan tomorrow", pct: 55 },
          ].map((r) => (
            <li key={r.name}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground tabular-nums">{r.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-foreground transition-all duration-700" style={{ width: `${r.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
