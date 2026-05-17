// Single source of truth for Blackframe state.
// Persisted to localStorage. Daily session engine ticks at midnight.

import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";
import { api } from "./api";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Routine {
  id: string;
  title: string;
  time: string;          // HH:MM
  days: Weekday[];       // 0=Sun..6=Sat
  createdAt: string;     // ISO
}

export interface RoutineLog {
  routineId: string;
  date: string;          // YYYY-MM-DD (local)
}

export interface Task {
  id: string;
  title: string;
  createdAt: string;     // ISO
  completedAt: string | null; // ISO when marked done
  archived: boolean;
}

interface PersistedState {
  routines: Routine[];
  routineLogs: RoutineLog[];
  tasks: Task[];
  version: 1;
}

const STORAGE_KEY = "blackframe:state:v1";

const DEFAULT_STATE: PersistedState = {
  version: 1,
  routines: [
    { id: "seed-r1", title: "Cold shower",        time: "06:30", days: [0,1,2,3,4,5,6], createdAt: new Date().toISOString() },
    { id: "seed-r2", title: "Deep work — 90 min", time: "08:00", days: [1,2,3,4,5],     createdAt: new Date().toISOString() },
    { id: "seed-r3", title: "Train",              time: "17:30", days: [1,3,5],         createdAt: new Date().toISOString() },
    { id: "seed-r4", title: "Read 20 pages",      time: "21:00", days: [0,1,2,3,4,5,6], createdAt: new Date().toISOString() },
  ],
  routineLogs: [],
  tasks: [],
};

// --- date helpers (local time) ---
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d); c.setDate(c.getDate() + n); return c;
}
function msUntilNextMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 50); // 50ms cushion
  return next.getTime() - now.getTime();
}

// --- store interface ---
interface StoreValue {
  // raw
  routines: Routine[];
  tasks: Task[];
  // session
  today: string;        // YYYY-MM-DD
  now: Date;
  weekday: Weekday;
  // routines
  todaysRoutines: Routine[];
  isRoutineDone: (routineId: string, date?: string) => boolean;
  toggleRoutine: (routineId: string) => void;
  routineStreak: (routineId: string) => number;
  addRoutine: (input: { title: string; time: string; days: Weekday[] }) => void;
  deleteRoutine: (routineId: string) => void;
  // tasks
  todaysTasks: Task[];        // active (not archived, not completed before today) — carry-over included
  allTasks: Task[];
  addTask: (title: string) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  archiveTask: (taskId: string) => void;
  unarchiveTask: (taskId: string) => void;
  // bulk
  resetAllData: () => void;
  overwriteState: (newState: PersistedState) => void;
  // analytics helpers
  routineCompletionsForDate: (date: string) => number;
  scheduledRoutineCountForDate: (date: string) => number;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.version !== 1) return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [now, setNow] = useState<Date>(() => new Date());
  const hydrated = useRef(false);
  const { user } = useAuth();

  // Hydrate from localStorage on client
  useEffect(() => {
    setState(loadState());
    hydrated.current = true;
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // Daily session engine: tick at midnight + every minute as a clock.
  useEffect(() => {
    let midnightTimeout: ReturnType<typeof setTimeout>;
    const clock = setInterval(() => setNow(new Date()), 60_000);

    const scheduleMidnight = () => {
      const n = new Date();
      midnightTimeout = setTimeout(() => {
        setNow(new Date()); // triggers re-derivation of today/weekday
        scheduleMidnight();
      }, msUntilNextMidnight(n));
    };
    scheduleMidnight();

    const onVisible = () => { if (document.visibilityState === "visible") setNow(new Date()); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(clock);
      clearTimeout(midnightTimeout);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const today = toLocalDateStr(now);
  const weekday = now.getDay() as Weekday;

  // --- derived: routine completion lookup ---
  const completionIndex = useMemo(() => {
    const m = new Map<string, Set<string>>(); // date -> set(routineId)
    for (const log of state.routineLogs) {
      let s = m.get(log.date);
      if (!s) { s = new Set(); m.set(log.date, s); }
      s.add(log.routineId);
    }
    return m;
  }, [state.routineLogs]);

  const isRoutineDone = (routineId: string, date: string = today) =>
    completionIndex.get(date)?.has(routineId) ?? false;

  const toggleRoutine = (routineId: string) => {
    setState((s) => {
      const exists = s.routineLogs.some((l) => l.routineId === routineId && l.date === today);
      const isDone = !exists;
      if (user) {
        if (isDone) {
          api.insertRoutineLog({ routine_id: routineId, user_id: user.id, date: today }).catch(console.error);
        } else {
          api.deleteRoutineLog(routineId, today, user.id).catch(console.error);
        }
      }
      return {
        ...s,
        routineLogs: exists
          ? s.routineLogs.filter((l) => !(l.routineId === routineId && l.date === today))
          : [...s.routineLogs, { routineId, date: today }],
      };
    });
  };

  const routineStreak = (routineId: string): number => {
    const r = state.routines.find((x) => x.id === routineId);
    if (!r) return 0;
    let streak = 0;
    // Start from today; if today is scheduled but not done, start at yesterday so
    // missing today doesn't kill an otherwise live streak before day ends.
    let cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    const todayDone = isRoutineDone(routineId, toLocalDateStr(cursor));
    const todayScheduled = r.days.includes(cursor.getDay() as Weekday);
    if (todayScheduled && !todayDone) cursor = addDays(cursor, -1);

    // walk backward — only scheduled days count toward streak; missed scheduled day breaks it.
    for (let i = 0; i < 365; i++) {
      const wd = cursor.getDay() as Weekday;
      if (r.days.includes(wd)) {
        if (isRoutineDone(routineId, toLocalDateStr(cursor))) {
          streak += 1;
        } else {
          break;
        }
      }
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  const addRoutine: StoreValue["addRoutine"] = ({ title, time, days }) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    if (user) {
      api.insertRoutine({
        id, user_id: user.id, title, time, days, archived: false, created_at: createdAt
      }).catch(console.error);
    }
    
    setState((s) => ({
      ...s,
      routines: [...s.routines, { id, title, time, days, createdAt }],
    }));
  };

  const deleteRoutine = (routineId: string) => {
    if (user) api.deleteRoutine(routineId).catch(console.error);
    setState((s) => ({
      ...s,
      routines: s.routines.filter((r) => r.id !== routineId),
      routineLogs: s.routineLogs.filter((l) => l.routineId !== routineId),
    }));
  };

  // --- tasks ---
  const addTask = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    if (user) {
      api.insertTask({
        id, user_id: user.id, title: trimmed, completed_at: null, archived: false, created_at: createdAt
      }).catch(console.error);
    }
    
    setState((s) => ({
      ...s,
      tasks: [
        { id, title: trimmed, createdAt, completedAt: null, archived: false },
        ...s.tasks,
      ],
    }));
  };

  const toggleTask = (taskId: string) => {
    setState((s) => {
      const task = s.tasks.find((t) => t.id === taskId);
      if (!task) return s;
      const isCompletedNow = !task.completedAt;
      const newCompletedAt = isCompletedNow ? new Date().toISOString() : null;
      
      if (user) {
        api.updateTask(taskId, { completed_at: newCompletedAt }).catch(console.error);
        if (isCompletedNow) {
          api.insertTaskLog({
            task_id: taskId, user_id: user.id, completed_at: newCompletedAt!, completion_date: newCompletedAt!.split('T')[0]
          }).catch(console.error);
        } else {
          // If un-completing, we should ideally remove the task log for today, assuming we completed it today.
          // The exact requirements didn't specify removing logs on undo, but let's be safe.
          const dateStr = task.completedAt?.split('T')[0];
          if (dateStr) api.deleteTaskLog(taskId, dateStr, user.id).catch(console.error);
        }
      }
      
      return {
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, completedAt: newCompletedAt } : t
        ),
      };
    });
  };

  const deleteTask = (taskId: string) => {
    if (user) api.deleteTask(taskId).catch(console.error);
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }));
  };

  const archiveTask = (taskId: string) => {
    if (user) api.updateTask(taskId, { archived: true }).catch(console.error);
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === taskId ? { ...t, archived: true } : t) }));
  };

  const unarchiveTask = (taskId: string) => {
    if (user) api.updateTask(taskId, { archived: false }).catch(console.error);
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === taskId ? { ...t, archived: false } : t) }));
  };

  // Today view: not archived. Includes:
  //  - tasks not completed (any created date) → carry-over
  //  - tasks completed today (so user sees what they finished)
  const todaysTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      if (t.archived) return false;
      if (!t.completedAt) return true;
      return toLocalDateStr(new Date(t.completedAt)) === today;
    });
  }, [state.tasks, today]);

  const todaysRoutines = useMemo(
    () => state.routines.filter((r) => r.days.includes(weekday)),
    [state.routines, weekday]
  );

  const scheduledRoutineCountForDate = (date: string) => {
    const d = new Date(date + "T00:00:00");
    const wd = d.getDay() as Weekday;
    return state.routines.filter((r) => r.days.includes(wd)).length;
  };

  const routineCompletionsForDate = (date: string) => {
    const wd = (new Date(date + "T00:00:00")).getDay() as Weekday;
    const scheduled = new Set(state.routines.filter((r) => r.days.includes(wd)).map((r) => r.id));
    let n = 0;
    for (const id of completionIndex.get(date) ?? []) if (scheduled.has(id)) n++;
    return n;
  };

  const resetAllData = () => {
    setState({ ...DEFAULT_STATE, routines: [], tasks: [], routineLogs: [] });
  };

  const overwriteState = (newState: PersistedState) => {
    setState(newState);
  };

  const value: StoreValue = {
    routines: state.routines,
    tasks: state.tasks,
    today,
    now,
    weekday,
    todaysRoutines,
    isRoutineDone,
    toggleRoutine,
    routineStreak,
    addRoutine,
    deleteRoutine,
    todaysTasks,
    allTasks: state.tasks,
    addTask,
    toggleTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    resetAllData,
    overwriteState,
    routineCompletionsForDate,
    scheduledRoutineCountForDate,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
