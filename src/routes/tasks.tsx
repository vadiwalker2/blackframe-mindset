import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Check, Trash2, Archive, ArchiveRestore, Inbox } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, toLocalDateStr } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Blackframe" },
      { name: "description", content: "Persistent task system. Carry over what matters. Archive what's done." },
    ],
  }),
  component: TasksPage,
});

type Filter = "active" | "completed" | "archived";

function TasksPage() {
  const { allTasks, today, addTask, toggleTask, deleteTask, archiveTask, unarchiveTask } = useStore();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = useMemo(() => {
    if (filter === "archived") return allTasks.filter((t) => t.archived);
    if (filter === "completed") return allTasks.filter((t) => !t.archived && t.completedAt);
    return allTasks.filter((t) => !t.archived && !t.completedAt);
  }, [allTasks, filter]);

  const counts = useMemo(() => ({
    active: allTasks.filter((t) => !t.archived && !t.completedAt).length,
    completed: allTasks.filter((t) => !t.archived && t.completedAt).length,
    archived: allTasks.filter((t) => t.archived).length,
  }), [allTasks]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addTask(draft);
    setDraft("");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Focus"
        title="Tasks"
        subtitle="Persistent. Carries over. Until done."
      />

      <form onSubmit={submit} className="mb-4 flex items-center gap-2 glass border border-border/60 rounded-2xl px-4 py-2.5 focus-within:border-foreground/40 transition-colors">
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
        {(["active","completed","archived"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all flex items-center gap-1.5 ${
              filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
            <span className="tabular-nums opacity-60">{counts[f]}</span>
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
          {filtered.map((t) => {
            const carried = !t.completedAt && !t.archived && toLocalDateStr(new Date(t.createdAt)) !== today;
            return (
              <li key={t.id} className="glass border border-border/60 rounded-xl px-4 py-3 flex items-center gap-3 group animate-fade-up">
                <button
                  onClick={() => toggleTask(t.id)}
                  disabled={t.archived}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    t.completedAt ? "bg-foreground border-foreground" : "border-muted-foreground/40 hover:border-foreground"
                  } ${t.archived ? "opacity-50" : ""}`}
                >
                  {t.completedAt && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                </button>
                <p className={`text-sm flex-1 truncate ${t.completedAt || t.archived ? "text-muted-foreground line-through" : ""}`}>
                  {t.title}
                </p>
                {carried && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    Carried
                  </span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.archived ? (
                    <button onClick={() => unarchiveTask(t.id)} className="text-muted-foreground hover:text-foreground p-1.5" aria-label="Restore">
                      <ArchiveRestore className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => archiveTask(t.id)} className="text-muted-foreground hover:text-foreground p-1.5" aria-label="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-destructive p-1.5" aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Tasks persist until you archive or delete them. Uncompleted ones carry over each day.
      </p>
    </AppShell>
  );
}
