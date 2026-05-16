import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Check, Trash2, Archive, Inbox } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MOCK_TASKS, type Task } from "@/lib/mock-data";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Blackframe" },
      { name: "description", content: "Persistent task system. Carry over what matters. Archive what's done." },
    ],
  }),
  component: TasksPage,
});

type Filter = "active" | "completed" | "all";

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setTasks((ts) => [{ id: crypto.randomUUID(), title: draft.trim(), completed: false, createdAt: new Date().toISOString() }, ...ts]);
    setDraft("");
  };

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  const remove = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Focus"
        title="Tasks"
        subtitle="Persistent. Carries over. Until done."
      />

      <form onSubmit={add} className="mb-4 flex items-center gap-2 glass border border-border/60 rounded-2xl px-4 py-2.5 focus-within:border-foreground/40 transition-colors">
        <Plus className="w-4 h-4 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs to get done?"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground py-1.5"
        />
        {draft && (
          <button type="submit" className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background">
            Add
          </button>
        )}
      </form>

      <div className="flex gap-1 mb-5 bg-secondary p-1 rounded-xl w-fit">
        {(["active","completed","all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
              filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass border border-border/60 rounded-2xl py-16 text-center animate-fade-up">
          <Inbox className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li key={t.id} className="glass border border-border/60 rounded-xl px-4 py-3 flex items-center gap-3 group animate-fade-up">
              <button
                onClick={() => toggle(t.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                  t.completed ? "bg-foreground border-foreground" : "border-muted-foreground/40 hover:border-foreground"
                }`}
              >
                {t.completed && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
              </button>
              <p className={`text-sm flex-1 truncate ${t.completed ? "text-muted-foreground line-through" : ""}`}>
                {t.title}
              </p>
              {t.carriedOver && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  Carried
                </span>
              )}
              <button
                onClick={() => remove(t.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <Archive className="w-3 h-3" />
        Completed tasks are archived to history at midnight.
      </p>
    </AppShell>
  );
}
