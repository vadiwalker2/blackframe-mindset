import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Flame, Plus, Check, Clock, Quote } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
  const [showCompleted, setShowCompleted] = useState(false);

  // Isolated Primary Focus State
  const [primaryFocus, setPrimaryFocus] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("blackframe:primary-focus") || "";
  });
  const [isPrimaryDone, setIsPrimaryDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("blackframe:primary-focus-done") === "true";
  });
  const [focusDate, setFocusDate] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("blackframe:primary-focus-date") || "";
  });

  // Daily reset for Primary Focus
  useEffect(() => {
    if (focusDate !== today) {
      setPrimaryFocus("");
      setIsPrimaryDone(false);
      setFocusDate(today);
      localStorage.removeItem("blackframe:primary-focus");
      localStorage.removeItem("blackframe:primary-focus-done");
      localStorage.setItem("blackframe:primary-focus-date", today);
    }
  }, [today, focusDate]);

  const handleSavePrimary = (val: string) => {
    setPrimaryFocus(val);
    localStorage.setItem("blackframe:primary-focus", val);
  };

  const handleTogglePrimary = () => {
    const nextVal = !isPrimaryDone;
    setIsPrimaryDone(nextVal);
    localStorage.setItem("blackframe:primary-focus-done", String(nextVal));
  };

  const handleDeletePrimary = () => {
    setPrimaryFocus("");
    setIsPrimaryDone(false);
    localStorage.removeItem("blackframe:primary-focus");
    localStorage.removeItem("blackframe:primary-focus-done");
  };

  // Group active vs completed items
  const activeRoutines = todaysRoutines.filter((r) => !isRoutineDone(r.id));
  const completedRoutines = todaysRoutines.filter((r) => isRoutineDone(r.id));
  const activeTasks = todaysTasks.filter((t) => !t.completedAt);
  const completedTasks = todaysTasks.filter((t) => t.completedAt);

  const completedRoutinesCount = completedRoutines.length;
  const completedTasksCount = completedTasks.length;
  const totalItems = todaysRoutines.length + todaysTasks.length;
  const completedItems = completedRoutinesCount + completedTasksCount;
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

  const greeting = useMemo(() => {
    const hr = now.getHours();
    if (hr >= 5 && hr < 12) return "Good morning";
    if (hr >= 12 && hr < 18) return "Good afternoon";
    if (hr >= 18 && hr < 22) return "Good evening";
    return "Quiet hours";
  }, [now]);

  const displayName = useMemo(() => {
    if (!user) return "";
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) return fullName.split(" ")[0];
    return user.email?.split("@")[0] || "Friend";
  }, [user]);

  const totalCompleted = completedRoutinesCount + completedTasksCount;

  return (
    <AppShell>
      {/* Subtle dynamic top ambient glow that shifts opacity and strength as progress pct increases */}
      <div 
        className="absolute top-0 inset-x-0 h-[320px] pointer-events-none transition-opacity duration-[1000ms] -z-10 select-none"
        style={{ 
          backgroundImage: `radial-gradient(ellipse at top, oklch(0.72 0.16 245 / ${0.003 + (pct / 100) * 0.022}), transparent 65%)` 
        }} 
      />

      {/* Header & Subtle Ambient Clock */}
      <header className="mb-8 animate-fade-up">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
                {greeting}{displayName ? `, ${displayName}` : ""}
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground select-none">
              {dateStr}
            </h1>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs tracking-widest text-muted-foreground/30 font-light select-none">
              {timeStr}
            </span>
          </div>
        </div>
      </header>

      {/* Auth CTA */}
      {!user && (
        <section className="mb-6 animate-fade-up" style={{ animationDelay: "30ms" }}>
          <div className="glass rounded-xl p-4 border border-border/40 flex items-center justify-between transition-premium hover:border-border/50">
            <div>
              <p className="text-xs font-medium">Sync your progress</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Sign in to save data to the cloud.</p>
            </div>
            <button
              onClick={signInWithGoogle}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer active:scale-[0.97]"
            >
              Sign in
            </button>
          </div>
        </section>
      )}

      {/* Primary Focus Section */}
      <section className="mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="glass rounded-xl border border-border/30 p-5 relative overflow-hidden transition-premium hover:border-border/40 duration-500">
          <div className="flex items-center justify-between mb-3 select-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
              <span className={`h-1 w-1 rounded-full transition-colors duration-500 ${isPrimaryDone ? "bg-emerald-500" : "bg-primary"}`} /> 
              Primary Focus
            </span>
            {primaryFocus && (
              <button
                onClick={handleDeletePrimary}
                className="text-[10px] font-medium text-muted-foreground/45 hover:text-muted-foreground/80 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          
          {!primaryFocus ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="What is your single intention for today?"
                className="flex-1 bg-transparent border-b border-border/20 outline-none text-xs placeholder:text-muted-foreground/30 py-1 focus:border-foreground/20 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) handleSavePrimary(val);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const val = input.value.trim();
                  if (val) handleSavePrimary(val);
                }}
                className="text-[10px] px-3 py-1 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-premium cursor-pointer font-medium active:scale-[0.96]"
              >
                Set
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePrimary}
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-premium cursor-pointer shrink-0 duration-300 active:scale-[0.90] ${
                  isPrimaryDone ? "bg-foreground border-foreground scale-95" : "border-muted-foreground/30 hover:border-foreground/50"
                }`}
              >
                {isPrimaryDone && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
              </button>
              <p className={`text-sm font-medium flex-1 transition-premium leading-relaxed duration-500 ${
                isPrimaryDone ? "text-muted-foreground/40 line-through font-normal" : "text-foreground/90"
              }`}>
                {primaryFocus}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Progress & Momentum Dashboard */}
      <section className="grid grid-cols-2 gap-4 mb-6 animate-fade-up" style={{ animationDelay: "90ms" }}>
        {/* Progress Card */}
        <div className="glass rounded-xl p-5 border border-border/30 flex items-center gap-4 transition-premium hover:border-border/40 duration-500">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="var(--color-secondary)"
                strokeWidth="2.5"
                fill="transparent"
                className="opacity-15"
              />
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="transparent"
                className="text-foreground transition-all duration-700"
                style={{
                  strokeDasharray: 2 * Math.PI * 19,
                  strokeDashoffset: 2 * Math.PI * 19 * (1 - pct / 100),
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-semibold tabular-nums text-foreground/90 select-none">
              {pct}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
              Progress
            </p>
            <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium transition-all duration-500">
              {totalItems === 0
                ? "No items"
                : pct === 100
                  ? "All done"
                  : `${completedItems} of ${totalItems} done`}
            </p>
          </div>
        </div>

        {/* Streak Card - mounts a key-based pulse whenever bestStreak increases */}
        <div className="glass rounded-xl p-5 border border-border/30 flex items-center gap-4 transition-premium hover:border-border/40 duration-500">
          <div 
            key={`icon-${bestStreak}`}
            className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center shrink-0 text-amber-500/90 relative animate-streak-pulse"
          >
            <Flame className="w-5 h-5" />
            <span className="absolute inset-0 rounded-full bg-amber-500/5 blur-sm" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
              Streak
            </p>
            <p className="text-base font-bold text-foreground tabular-nums mt-0.5 flex items-baseline gap-1 select-none">
              <span key={`val-${bestStreak}`} className="inline-block animate-streak-pulse">
                {bestStreak}
              </span>
              <span className="text-[10px] font-normal text-muted-foreground/60">days</span>
            </p>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="glass rounded-xl p-4 mb-6 border border-border/30 animate-fade-up transition-premium hover:border-border/40" style={{ animationDelay: "120ms" }}>
        <div className="flex gap-2.5 items-start">
          <Quote className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-muted-foreground/80 font-normal italic select-none">
            {getQuoteOfDay()}
          </p>
        </div>
      </section>

      {/* Calm Success State Banner - breathes slow and calm when done */}
      {pct === 100 && totalItems > 0 && (
        <div className="glass border border-border/30 rounded-xl p-6 text-center my-6 relative overflow-hidden animate-fade-up animate-breathe">
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/[0.025] via-transparent to-transparent animate-pulse duration-[8000ms] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 transition-transform duration-[600ms]">
              <Check className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <h3 className="text-xs font-semibold tracking-wide text-foreground/90 uppercase select-none">
              Intentions Fulfilled
            </h3>
            <p className="text-xs text-muted-foreground/70 max-w-[280px] leading-relaxed select-none">
              All scheduled routines and tasks are checked. Your discipline is holding strong. Time to rest.
            </p>
          </div>
        </div>
      )}

      {/* Active Routines */}
      <section className="mb-6 animate-fade-up" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between mb-3 select-none">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Routines</h2>
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {completedRoutinesCount}/{todaysRoutines.length}
          </span>
        </div>
        
        {activeRoutines.length === 0 ? (
          todaysRoutines.length === 0 ? (
            <div className="text-center py-5 border border-dashed border-border/20 rounded-xl bg-white/[0.005]">
              <p className="text-xs text-muted-foreground/40">No routines scheduled today.</p>
            </div>
          ) : activeRoutines.length === 0 && (
            <div className="text-center py-4 border border-dashed border-border/10 rounded-xl bg-white/[0.002]">
              <p className="text-xs text-muted-foreground/30">All routines finished.</p>
            </div>
          )
        ) : (
          <ul className="space-y-2">
            {activeRoutines.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => toggleRoutine(r.id)}
                  className="w-full glass rounded-xl border border-border/30 px-4 py-3.5 flex items-center gap-3 text-left transition-premium hover:border-border/60 hover:bg-white/[0.015] active:scale-[0.985] cursor-pointer group duration-300"
                >
                  <span className="w-5 h-5 rounded-full border border-muted-foreground/30 flex items-center justify-center shrink-0 transition-premium relative overflow-hidden group-hover:border-foreground/40 duration-300">
                    <span className="w-2 h-2 rounded-full bg-foreground scale-0 opacity-0 group-hover:scale-50 group-hover:opacity-40 transition-premium duration-300" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/90 tracking-tight">
                      {r.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground/30" /> {r.time}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 tabular-nums bg-secondary/35 px-2 py-0.5 rounded-full border border-border/20">
                    <Flame className="w-3 h-3 text-amber-500/70" /> {routineStreak(r.id)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active Tasks */}
      <section className="mb-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between mb-3 select-none">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Tasks</h2>
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {completedTasksCount}/{todaysTasks.length}
          </span>
        </div>

        {/* Command Add Task Input */}
        <form onSubmit={submit} className="mb-3 flex items-center gap-2.5 glass border border-border/30 rounded-xl px-4 py-3 focus-within:border-foreground/35 focus-within:ring-[0.5px] focus-within:ring-foreground/20 transition-all duration-300">
          <Plus className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Create intention..."
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground/30 py-0.5"
          />
          <span className="text-[9px] tracking-widest text-muted-foreground/45 font-mono border border-border/35 rounded px-1.5 py-0.5 select-none scale-90">
            ENTER
          </span>
        </form>

        {activeTasks.length === 0 ? (
          todaysTasks.length === 0 ? (
            <div className="text-center py-5 border border-dashed border-border/20 rounded-xl bg-white/[0.005]">
              <p className="text-xs text-muted-foreground/40">Inbox zero. Add what matters.</p>
            </div>
          ) : activeTasks.length === 0 && (
            <div className="text-center py-4 border border-dashed border-border/10 rounded-xl bg-white/[0.002]">
              <p className="text-xs text-muted-foreground/30">All tasks completed.</p>
            </div>
          )
        ) : (
          <ul className="space-y-2">
            {activeTasks.map((t) => {
              const carried = !t.completedAt && toLocalDateStr(new Date(t.createdAt)) !== today;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="w-full glass rounded-xl border border-border/30 px-4 py-3.5 flex items-center gap-3 text-left transition-premium hover:border-border/60 hover:bg-white/[0.015] active:scale-[0.985] cursor-pointer group duration-300"
                  >
                    <span className="w-5 h-5 rounded-md border border-muted-foreground/30 flex items-center justify-center shrink-0 transition-premium relative overflow-hidden group-hover:border-foreground/40 duration-300">
                      <span className="w-2 h-2 rounded bg-foreground scale-0 opacity-0 group-hover:scale-50 group-hover:opacity-40 transition-premium duration-300" />
                    </span>
                    <p className="text-sm font-medium text-foreground/90 tracking-tight flex-1 truncate">
                      {t.title}
                    </p>
                    {carried && (
                      <span className="text-[8px] tracking-widest uppercase text-muted-foreground/40 border border-border/30 rounded px-1.5 py-0.5 select-none font-medium scale-90">
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

      {/* Completed Section (Collapsed by default) */}
      {totalCompleted > 0 && (
        <section className="mt-8 mb-4 animate-fade-up" style={{ animationDelay: "210ms" }}>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45 hover:text-muted-foreground/60 transition-colors cursor-pointer select-none"
          >
            <span>Completed ({totalCompleted})</span>
            <span className={`text-[8px] transition-transform duration-300 ${showCompleted ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          
          {showCompleted && (
            <ul className="space-y-2 mt-3 animate-scale-in">
              {/* Completed Routines */}
              {completedRoutines.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => toggleRoutine(r.id)}
                    className="w-full glass rounded-xl border border-border/20 px-4 py-3 flex items-center gap-3.5 text-left opacity-40 hover:opacity-60 transition-premium cursor-pointer active:scale-[0.99] duration-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-foreground border border-foreground flex items-center justify-center shrink-0 transition-transform duration-300 scale-100">
                      <Check className="w-2.5 h-2.5 text-background animate-scale-in" strokeWidth={3} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through truncate text-foreground/80">
                        {r.title}
                      </p>
                    </div>
                    <span className="text-[10px] flex items-center gap-0.5 tabular-nums">
                      <Flame className="w-3 h-3 text-amber-500/60" /> {routineStreak(r.id)}
                    </span>
                  </button>
                </li>
              ))}
              
              {/* Completed Tasks */}
              {completedTasks.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="w-full glass rounded-xl border border-border/20 px-4 py-3 flex items-center gap-3.5 text-left opacity-40 hover:opacity-60 transition-premium cursor-pointer active:scale-[0.99] duration-300"
                  >
                    <span className="w-5 h-5 rounded-md bg-foreground border border-foreground flex items-center justify-center shrink-0 transition-transform duration-300 scale-100">
                      <Check className="w-2.5 h-2.5 text-background animate-scale-in" strokeWidth={3} />
                    </span>
                    <p className="text-sm font-medium line-through flex-1 truncate text-foreground/80">
                      {t.title}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Extra Bottom Spacing for Mobile Nav */}
      <div className="h-16 pointer-events-none" />
    </AppShell>
  );
}


