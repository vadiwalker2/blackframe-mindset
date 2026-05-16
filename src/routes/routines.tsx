import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Flame, Clock, Trash2, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MOCK_ROUTINES, DAY_LABELS, type Routine, type Weekday } from "@/lib/mock-data";

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
  const [routines, setRoutines] = useState<Routine[]>(MOCK_ROUTINES);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<Weekday[]>([1,2,3,4,5]);

  const toggleDay = (d: Weekday) =>
    setDays((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort() as Weekday[]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || days.length === 0) return;
    setRoutines((rs) => [...rs, {
      id: crypto.randomUUID(), title: title.trim(), time, days, completedToday: false, streak: 0,
    }]);
    setTitle(""); setTime("07:00"); setDays([1,2,3,4,5]); setCreating(false);
  };

  const remove = (id: string) => setRoutines((rs) => rs.filter((r) => r.id !== id));
  const toggle = (id: string) =>
    setRoutines((rs) => rs.map((r) => r.id === id ? { ...r, completedToday: !r.completedToday } : r));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Discipline"
        title="Routines"
        subtitle="Repeatable rituals. Compounded over time."
        action={
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-full bg-foreground text-background w-10 h-10 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
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

      <ul className="space-y-2">
        {routines.map((r) => (
          <li key={r.id} className="glass border border-border/60 rounded-2xl p-4 animate-fade-up group">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(r.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  r.completedToday ? "bg-foreground border-foreground" : "border-muted-foreground/40 hover:border-foreground"
                }`}
              >
                {r.completedToday && <span className="w-2 h-2 rounded-full bg-background" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${r.completedToday ? "text-muted-foreground line-through" : ""}`}>
                  {r.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{r.streak}d</span>
                  <span className="flex gap-0.5">
                    {DAY_LABELS.map((l, i) => (
                      <span key={i} className={r.days.includes(i as Weekday) ? "text-foreground" : "opacity-30"}>{l}</span>
                    ))}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(r.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
