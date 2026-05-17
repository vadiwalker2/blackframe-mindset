import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { api, DbRoutine, DbRoutineLog, DbTask } from "@/lib/api";

export function MigrationManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { routines, tasks, routineLogs, overwriteState } = useStore();
  const [checking, setChecking] = useState(false);
  const [modalState, setModalState] = useState<"none" | "upload_prompt" | "conflict_prompt">("none");
  const [cloudData, setCloudData] = useState<{
    routines: DbRoutine[];
    routineLogs: DbRoutineLog[];
    tasks: DbTask[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    const isSynced = localStorage.getItem(`blackframe:sync:${user.id}`);
    if (isSynced === "true") {
      // Already handled migration for this user
      return;
    }

    const checkSync = async () => {
      setChecking(true);
      try {
        await api.initUserSettings(user.id);
        const data = await api.fetchAllData(user.id);
        const cloudHasData = data.routines.length > 0 || data.tasks.length > 0;
        const localHasData = routines.length > 0 || tasks.length > 0;

        // If it's the default seed state and the user just logged in, we might not count it as "localHasData"
        // But for safety, we'll treat any data as local data. Wait, the store initializes with seed data if empty.
        // We can check if all tasks/routines have "seed-" IDs to consider it "empty".
        const localIsSeedOnly = routines.every(r => r.id.startsWith("seed-")) && tasks.length === 0 && routineLogs.length === 0;
        const actualLocalHasData = localHasData && !localIsSeedOnly;

        setCloudData(data);

        if (!cloudHasData && actualLocalHasData) {
          setModalState("upload_prompt");
        } else if (cloudHasData && actualLocalHasData) {
          setModalState("conflict_prompt");
        } else if (cloudHasData && !actualLocalHasData) {
          // Pull cloud silently since local is empty/seed
          handlePullCloud(data);
        } else {
          // Both empty, or cloud empty and local is just seeds
          // Let's just push the seeds to cloud to initialize them
          await api.batchUpload(user.id, { routines, routineLogs, tasks });
          markSynced();
        }
      } catch (err) {
        console.error("Failed to check sync status:", err);
      } finally {
        setChecking(false);
      }
    };

    checkSync();
  }, [user]);

  const markSynced = () => {
    if (user) localStorage.setItem(`blackframe:sync:${user.id}`, "true");
    setModalState("none");
  };

  const handlePushLocal = async () => {
    if (!user) return;
    setChecking(true);
    await api.batchUpload(user.id, { routines, routineLogs, tasks });
    markSynced();
    setChecking(false);
  };

  const handlePullCloud = (data: typeof cloudData) => {
    if (!data) return;
    // Overwrite local state with cloud state
    overwriteState({
      routines: data.routines.map(r => ({
        id: r.id, title: r.title, time: r.time, days: r.days as any, createdAt: r.created_at
      })),
      routineLogs: data.routineLogs.map(l => ({
        routineId: l.routine_id, date: l.date
      })),
      tasks: data.tasks.map(t => ({
        id: t.id, title: t.title, completedAt: t.completed_at, archived: t.archived, createdAt: t.created_at
      })),
      version: 1
    });
    markSynced();
  };

  if (modalState !== "none") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="max-w-md w-full glass rounded-2xl border border-border/60 p-6 animate-fade-up shadow-2xl">
          <h2 className="text-lg font-semibold tracking-tight mb-2">
            {modalState === "upload_prompt" ? "Sync Local Data?" : "Data Conflict"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {modalState === "upload_prompt"
              ? "We found existing local Blackframe data. Would you like to sync it to your cloud account?"
              : "Your cloud account already has data, but you also have local data. Which should we prioritize?"}
          </p>

          {modalState === "upload_prompt" ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePushLocal}
                disabled={checking}
                className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Yes, sync to cloud
              </button>
              <button
                onClick={() => {
                  // If no, we start fresh on cloud by marking synced and maybe uploading empty?
                  // Actually, if they don't want to sync local data, we just clear local and start fresh?
                  // Or we just don't push, mark synced, and future actions will push.
                  // Wait, if we mark synced, the local data stays and will be pushed on next mutation.
                  // So we should wipe local data if they don't want it.
                  overwriteState({ routines: [], routineLogs: [], tasks: [], version: 1 });
                  markSynced();
                }}
                disabled={checking}
                className="w-full border border-border py-3 rounded-xl text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                No, start fresh
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handlePullCloud(cloudData)}
                disabled={checking}
                className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Use Cloud Data (Overwrite local)
              </button>
              <button
                onClick={handlePushLocal}
                disabled={checking}
                className="w-full border border-border py-3 rounded-xl text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50 text-destructive border-destructive/20 hover:border-destructive"
              >
                Use Local Data (Overwrite cloud)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
