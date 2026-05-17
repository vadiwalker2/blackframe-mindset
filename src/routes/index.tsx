import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Plus, Check, Clock, Quote } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, toLocalDateStr } from "@/lib/store";
import { getQuoteOfDay } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Blackframe" },
      { name: "description", content: "Your daily routines, tasks, and progress at a glance." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const {
    now, today, todaysRoutines, todaysTasks,
    isRoutineDone, toggleRoutine, routineStreak,
    toggleTask, addTask, routines,
  } = useStore();
  const { user, signInWithGoogle } = useAuth();
  const [draft, setDraft] = useState("");

  const completedRoutines = todaysRoutines.filter((r) => isRoutineDone(r.id)).length;
  const completedTasks = todaysTasks.filter((t) => t.completedAt).length;
  const totalItems = todaysRoutines.length + todaysTasks.length;
  const completedItems = completedRoutines + completedTasks;
  const pct = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const bestStreak = useMemo(() => {
    return routines.reduce((max, r) => Math.max(max, routineStreak(r.id)), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines, today]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addTask(draft);
    setDraft("");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={timeStr}
        title={dateStr}
        subtitle={
          totalItems === 0
            ? "Add a routine or task to begin."
            : pct === 100
              ? "Day complete. Reset and rest."
              : `${completedItems} of ${totalItems} done today.`
        }
      />

      {/* Auth CTA */}
      {!user && (
        <section className="mb-6 animate-fade-up" style={{ animationDelay: "30ms" }}>
          <div className="glass rounded-xl p-4 border border-border/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sync your progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sign in to save data to the cloud.</p>
            </div>
            <button
              onClick={signInWithGoogle}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </section>
      )}

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
            <p className="text-xs uppercase tracking-wider">Best streak</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{bestStreak}<span className="text-sm text-muted-foreground ml-1">d</span></p>
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
            {completedRoutines}/{todaysRoutines.length}
          </span>
        </div>
        {todaysRoutines.length === 0 ? (
          <p className="text-sm text-muted-foreground glass border border-border/60 rounded-xl px-4 py-6 text-center">
            No routines scheduled for today.
          </p>
        ) : (
          <ul className="space-y-2">
            {todaysRoutines.map((r) => {
              const done = isRoutineDone(r.id);
              return (
                <li key={r.id}>
                  <button
                    onClick={() => toggleRoutine(r.id)}
                    className="w-full glass rounded-xl border border-border/60 px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-border active:scale-[0.99]"
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      done ? "bg-foreground border-foreground" : "border-muted-foreground/40"
                    }`}>
                      {done && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${done ? "text-muted-foreground line-through" : ""}`}>
                        {r.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {r.time}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                      <Flame className="w-3 h-3" /> {routineStreak(r.id)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Tasks */}
      <section className="animate-fade-up" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tasks</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {completedTasks}/{todaysTasks.length}
          </span>
        </div>

        <form onSubmit={submit} className="mb-3 flex items-center gap-2 glass border border-border/60 rounded-xl px-3 py-2 focus-within:border-foreground/40 transition-colors">
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

        {todaysTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground glass border border-border/60 rounded-xl px-4 py-6 text-center">
            Inbox zero. Add what matters.
          </p>
        ) : (
          <ul className="space-y-2">
            {todaysTasks.map((t) => {
              const carried = !t.completedAt && toLocalDateStr(new Date(t.createdAt)) !== today;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="w-full glass rounded-xl border border-border/60 px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-border active:scale-[0.99]"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      t.completedAt ? "bg-foreground border-foreground" : "border-muted-foreground/40"
                    }`}>
                      {t.completedAt && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                    </span>
                    <p className={`text-sm flex-1 truncate ${t.completedAt ? "text-muted-foreground line-through" : ""}`}>
                      {t.title}
                    </p>
                    {carried && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        Carried
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
