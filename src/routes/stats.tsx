import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame, TrendingUp, Target, CheckCircle2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, toLocalDateStr } from "@/lib/store";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Blackframe" },
      { name: "description", content: "Weekly performance, streak analytics, routine vs task completion." },
    ],
  }),
  component: StatsPage,
});

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
  const {
    now, routines, allTasks,
    routineStreak, routineCompletionsForDate, scheduledRoutineCountForDate,
    isRoutineDone,
  } = useStore();

  const week = useMemo(() => {
    const days: { day: string; date: string; routines: number; tasks: number; scheduled: number; completedTasks: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const date = toLocalDateStr(d);
      const scheduled = scheduledRoutineCountForDate(date);
      const routineDone = routineCompletionsForDate(date);
      const completedTasks = allTasks.filter(
        (t) => t.completedAt && toLocalDateStr(new Date(t.completedAt)) === date
      ).length;
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        date,
        routines: scheduled === 0 ? 0 : Math.round((routineDone / scheduled) * 100),
        tasks: completedTasks,
        scheduled,
        completedTasks,
      });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines, allTasks, now.toDateString()]);

  const totalScheduled = week.reduce((a, d) => a + d.scheduled, 0);
  const totalRoutineDone = week.reduce((a, d) => a + Math.round((d.routines / 100) * d.scheduled), 0);
  const weeklyAvg = totalScheduled === 0 ? 0 : Math.round((totalRoutineDone / totalScheduled) * 100);
  const tasksClosedWeek = week.reduce((a, d) => a + d.completedTasks, 0);
  const longest = routines.reduce(
    (best, r) => {
      const s = routineStreak(r.id);
      return s > best.s ? { s, name: r.title } : best;
    },
    { s: 0, name: "—" }
  );

  const maxTasks = Math.max(1, ...week.map((d) => d.tasks));

  const topRoutinesProper = useMemo(() => {
    return routines.map((r) => {
      let scheduled = 0, done = 0;
      for (const d of week) {
        const wd = (new Date(d.date + "T00:00:00")).getDay() as 0|1|2|3|4|5|6;
        if (r.days.includes(wd)) {
          scheduled++;
          if (isRoutineDone(r.id, d.date)) done++;
        }
      }
      return { id: r.id, name: r.title, pct: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100) };
    }).sort((a, b) => b.pct - a.pct).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines, week]);

  const heatmapData = useMemo(() => {
    const days = [];
    const START_OFFSET = 89; // 90 days total including today
    
    const dStart = new Date(now);
    dStart.setDate(dStart.getDate() - START_OFFSET);
    dStart.setHours(0, 0, 0, 0);
    
    // Fill leading empty days to align weekdays (Sunday = 0, Monday = 1...)
    const startWeekday = dStart.getDay();
    for (let i = 0; i < startWeekday; i++) {
      days.push({ isPadding: true, id: `pad-${i}` });
    }

    for (let i = START_OFFSET; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const date = toLocalDateStr(d);
      
      const scheduled = scheduledRoutineCountForDate(date);
      const routineDone = routineCompletionsForDate(date);
      const completedTasks = allTasks.filter(
        (t) => t.completedAt && toLocalDateStr(new Date(t.completedAt)) === date
      ).length;

      const totalExpected = scheduled + completedTasks;
      const totalDone = routineDone + completedTasks;
      
      let pct = 0;
      if (totalExpected > 0) {
        pct = Math.round((totalDone / totalExpected) * 100);
      } else if (totalDone > 0) {
        pct = 100;
      }

      days.push({
        isPadding: false,
        id: date,
        displayDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        done: totalDone,
        pct,
        isToday: i === 0,
      });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines, allTasks, now.toDateString()]);

  return (
    <AppShell>
      <PageHeader eyebrow="This week" title="Statistics" subtitle="Patterns become identity. Watch yours." />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Flame} label="Longest streak" value={String(longest.s)} sub={longest.name} />
        <StatCard icon={TrendingUp} label="Weekly avg" value={`${weeklyAvg}%`} sub="Routine completion" />
        <StatCard icon={Target} label="Routines done" value={`${totalRoutineDone}/${totalScheduled}`} sub="This week" />
        <StatCard icon={CheckCircle2} label="Tasks closed" value={String(tasksClosedWeek)} sub="This week" />
      </div>

      <section className="glass border border-border/60 rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">7-day activity</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground" />Routines %</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" />Tasks</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {week.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center gap-1 items-end h-32">
                <div
                  className="w-2.5 rounded-t bg-foreground transition-all duration-500 min-h-[2px]"
                  style={{ height: `${d.routines}%` }}
                  title={`${d.routines}% routines`}
                />
                <div
                  className="w-2.5 rounded-t bg-muted-foreground/50 transition-all duration-500 min-h-[2px]"
                  style={{ height: `${(d.tasks / maxTasks) * 100}%` }}
                  title={`${d.tasks} tasks`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass border border-border/60 rounded-2xl p-5 mb-4 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Top routines (7d)</h2>
        {topRoutinesProper.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet. Consistency starts quietly.</p>
        ) : (
          <ul className="space-y-3">
            {topRoutinesProper.map((r) => (
              <li key={r.id}>
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
        )}
      </section>

      <section className="glass border border-border/60 rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "220ms" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Consistency (90d)</h2>
        <div className="flex justify-center w-full py-2">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
            {heatmapData.map((d: any) => {
              if (d.isPadding) {
                return <div key={d.id} className="w-3 h-3 md:w-3.5 md:h-3.5" />;
              }

              let bgClass = "bg-secondary/30 border border-border/10"; 
              if (d.pct > 0 && d.pct < 40) bgClass = "bg-foreground/30";
              else if (d.pct >= 40 && d.pct < 80) bgClass = "bg-foreground/60";
              else if (d.pct >= 80) bgClass = "bg-foreground/90";

              return (
                <div 
                  key={d.id} 
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-[2px] transition-all duration-300 ${bgClass} ${d.isToday ? 'ring-1 ring-foreground/60 ring-offset-2 ring-offset-background/50 z-10' : ''} group relative cursor-pointer hover:ring-1 hover:ring-foreground/40 hover:scale-[1.15] hover:z-20`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 w-max bg-background border border-border/40 rounded-lg p-2.5 shadow-2xl flex flex-col gap-1">
                     <p className="text-[11px] font-semibold text-foreground/90">{d.displayDate}</p>
                     <p className="text-[10px] text-muted-foreground">{d.done} intentions completed</p>
                     <p className="text-[10px] text-muted-foreground">{d.pct}% consistency</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
