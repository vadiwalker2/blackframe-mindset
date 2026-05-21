import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Flame, Clock, Trash2, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, type Weekday } from "@/lib/store";
import { DAY_LABELS } from "@/lib/mock-data";

export const Route = createFileRoute("/routines")({
  head: () => ({
    meta: [
      { title: "Routines — Blackframe" },
      { name: "description", content: "Build daily and weekly routines. Track streaks. Compound discipline." },
    ],
  }),
  component: RoutinesPage,
});

function RoutinesPage() {
  const { routines, addRoutine, deleteRoutine, isRoutineDone, toggleRoutine, routineStreak } = useStore();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<Weekday[]>([1,2,3,4,5]);

  const toggleDay = (d: Weekday) =>
    setDays((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort() as Weekday[]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || days.length === 0) return;
    addRoutine({ title: title.trim(), time, days });
    setTitle(""); setTime("07:00"); setDays([1,2,3,4,5]); setCreating(false);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Discipline"
        title="Routines"
        subtitle="Repeatable rituals. Compounded over time."
        action={
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-full bg-foreground text-background w-10 h-10 flex items-center justify-center hover:opacity-90 active:scale-[0.96] transition-premium"
            aria-label={creating ? "Cancel" : "New routine"}
          >
            {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        }
      />

      {creating && (
        <form onSubmit={submit} className="glass border border-border/60 rounded-2xl p-5 mb-6 space-y-4 animate-scale-in">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning meditation"
              className="w-full mt-1.5 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1.5 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground/40"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Repeat</label>
            <div className="mt-2 flex gap-1.5">
              {DAY_LABELS.map((l, i) => {
                const active = days.includes(i as Weekday);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i as Weekday)}
                    className={`flex-1 h-10 rounded-xl text-xs font-medium transition-all ${
                      active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create routine
          </button>
        </form>
      )}

      {routines.length === 0 ? (
        <p className="text-sm text-muted-foreground glass border border-border/40 rounded-xl px-4 py-10 text-center">
          Quiet space. No routines scheduled.
        </p>
      ) : (
        <ul className="space-y-2">
          {routines.map((r) => {
            const done = isRoutineDone(r.id);
            return (
              <li key={r.id} className="glass border border-border/60 rounded-2xl p-4 animate-fade-up group">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRoutine(r.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      done ? "bg-foreground border-foreground" : "border-muted-foreground/40 hover:border-foreground"
                    }`}
                  >
                    {done && <span className="w-2 h-2 rounded-full bg-background" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
                      {r.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{routineStreak(r.id)}d</span>
                      <span className="flex gap-0.5">
                        {DAY_LABELS.map((l, i) => (
                          <span key={i} className={r.days.includes(i as Weekday) ? "text-foreground" : "opacity-30"}>{l}</span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRoutine(r.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
