import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Check, Clock, Quote } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MOCK_ROUTINES, MOCK_TASKS, getQuoteOfDay, type Routine, type Task } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Blackframe" },
      { name: "description", content: "Your daily routines, tasks, and progress at a glance." },
    ],
  }),
  component: TodayPage,
});

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function TodayPage() {
  const now = useNow();
  const today = now.getDay();
  const [routines, setRoutines] = useState<Routine[]>(MOCK_ROUTINES);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [draft, setDraft] = useState("");

  const todaysRoutines = useMemo(
    () => routines.filter((r) => r.days.includes(today as 0|1|2|3|4|5|6)),
    [routines, today]
  );

  const totalItems = todaysRoutines.length + tasks.length;
  const completedItems =
    todaysRoutines.filter((r) => r.completedToday).length +
    tasks.filter((t) => t.completed).length;
  const pct = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const toggleRoutine = (id: string) =>
    setRoutines((rs) => rs.map((r) => r.id === id ? { ...r, completedToday: !r.completedToday } : r));
  const toggleTask = (id: string) =>
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setTasks((ts) => [{ id: crypto.randomUUID(), title: draft.trim(), completed: false, createdAt: new Date().toISOString() }, ...ts]);
    setDraft("");
  };

  const streakBest = Math.max(...routines.map((r) => r.streak), 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow={timeStr}
        title={dateStr}
        subtitle={pct === 100 ? "Day complete. Reset and rest." : `${completedItems} of ${totalItems} done today.`}
      />

      {/* Progress + streak */}
      <section className="grid grid-cols-5 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="col-span-3 glass rounded-2xl p-5 border border-border/60">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="text-2xl font-semibold tabular-nums">{pct}<span className="text-sm text-muted-foreground">%</span></p>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="col-span-2 glass rounded-2xl p-5 border border-border/60 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flame className="w-3.5 h-3.5" />
            <p className="text-xs uppercase tracking-wider">Streak</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{streakBest}<span className="text-sm text-muted-foreground ml-1">days</span></p>
        </div>
      </section>

      {/* Quote */}
      <section className="glass rounded-2xl p-5 mb-7 border border-border/60 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="flex gap-3">
          <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-balance">{getQuoteOfDay()}</p>
        </div>
      </section>

      {/* Today's routines */}
      <section className="mb-8 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Routines</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {todaysRoutines.filter((r) => r.completedToday).length}/{todaysRoutines.length}
          </span>
        </div>
        <ul className="space-y-2">
          {todaysRoutines.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => toggleRoutine(r.id)}
                className="w-full glass rounded-xl border border-border/60 px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-border active:scale-[0.99]"
              >
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  r.completedToday ? "bg-foreground border-foreground" : "border-muted-foreground/40"
                }`}>
                  {r.completedToday && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${r.completedToday ? "text-muted-foreground line-through" : ""}`}>
                    {r.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {r.time}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                  <Flame className="w-3 h-3" /> {r.streak}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Tasks */}
      <section className="animate-fade-up" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tasks</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {tasks.filter((t) => t.completed).length}/{tasks.length}
          </span>
        </div>

        <form onSubmit={addTask} className="mb-3 flex items-center gap-2 glass border border-border/60 rounded-xl px-3 py-2 focus-within:border-foreground/40 transition-colors">
          <Plus className="w-4 h-4 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground py-1"
          />
          {draft && (
            <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg bg-foreground text-background">
              Add
            </button>
          )}
        </form>

        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => toggleTask(t.id)}
                className="w-full glass rounded-xl border border-border/60 px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-border active:scale-[0.99]"
              >
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  t.completed ? "bg-foreground border-foreground" : "border-muted-foreground/40"
                }`}>
                  {t.completed && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                </span>
                <p className={`text-sm flex-1 truncate ${t.completed ? "text-muted-foreground line-through" : ""}`}>
                  {t.title}
                </p>
                {t.carriedOver && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    Yesterday
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
