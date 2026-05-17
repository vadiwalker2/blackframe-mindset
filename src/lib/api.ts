import { supabase } from "./supabase";
import { Routine, RoutineLog, Task } from "./store";

// Types matching Supabase tables
export interface DbRoutine {
  id: string;
  user_id: string;
  title: string;
  time: string;
  days: number[];
  archived: boolean;
  created_at: string;
}

export interface DbRoutineLog {
  id: string;
  routine_id: string;
  user_id: string;
  date: string;
  created_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  completed_at: string | null;
  archived: boolean;
  created_at: string;
}

export interface DbTaskLog {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string;
  completion_date: string;
}

export const api = {
  async fetchAllData(userId: string) {
    const [routines, routineLogs, tasks] = await Promise.all([
      supabase.from("routines").select("*").eq("user_id", userId),
      supabase.from("routine_logs").select("*").eq("user_id", userId),
      supabase.from("tasks").select("*").eq("user_id", userId),
    ]);
    return {
      routines: routines.data as DbRoutine[] || [],
      routineLogs: routineLogs.data as DbRoutineLog[] || [],
      tasks: tasks.data as DbTask[] || [],
    };
  },

  async initUserSettings(userId: string) {
    // Attempt to insert a default row. 
    // Since user_id is unique, we can use ON CONFLICT DO NOTHING (via RPC or just ignore error).
    // The easiest way is upsert or just insert and catch conflict.
    const { error } = await supabase.from("user_settings").insert([
      { user_id: userId, settings_json: {} }
    ]);
    // Ignore error if it already exists (duplicate key)
    if (error && error.code !== '23505') {
      console.error("Failed to init user settings:", error);
    }
  },

  async insertRoutine(routine: DbRoutine) {
    return supabase.from("routines").insert([routine]);
  },

  async updateRoutine(routineId: string, updates: Partial<DbRoutine>) {
    return supabase.from("routines").update(updates).eq("id", routineId);
  },

  async deleteRoutine(routineId: string) {
    return supabase.from("routines").delete().eq("id", routineId);
  },

  async insertRoutineLog(log: Omit<DbRoutineLog, "id" | "created_at">) {
    return supabase.from("routine_logs").insert([log]);
  },

  async deleteRoutineLog(routineId: string, date: string, userId: string) {
    return supabase.from("routine_logs").delete().match({ routine_id: routineId, date, user_id: userId });
  },

  async insertTask(task: DbTask) {
    return supabase.from("tasks").insert([task]);
  },

  async updateTask(taskId: string, updates: Partial<DbTask>) {
    return supabase.from("tasks").update(updates).eq("id", taskId);
  },

  async deleteTask(taskId: string) {
    return supabase.from("tasks").delete().eq("id", taskId);
  },
  
  async insertTaskLog(log: Omit<DbTaskLog, "id">) {
    return supabase.from("task_logs").insert([log]);
  },
  
  async deleteTaskLog(taskId: string, date: string, userId: string) {
    return supabase.from("task_logs").delete().match({ task_id: taskId, completion_date: date, user_id: userId });
  },

  async batchUpload(
    userId: string,
    data: { routines: Routine[]; routineLogs: RoutineLog[]; tasks: Task[] }
  ) {
    // 1. Upload routines
    const dbRoutines: DbRoutine[] = data.routines.map(r => ({
      id: r.id,
      user_id: userId,
      title: r.title,
      time: r.time,
      days: r.days,
      archived: false,
      created_at: r.createdAt
    }));
    if (dbRoutines.length > 0) {
      await supabase.from("routines").upsert(dbRoutines);
    }

    // 2. Upload routine logs
    const dbRoutineLogs = data.routineLogs.map(l => ({
      routine_id: l.routineId,
      user_id: userId,
      date: l.date
    }));
    if (dbRoutineLogs.length > 0) {
      await supabase.from("routine_logs").upsert(dbRoutineLogs, { onConflict: 'routine_id,date' });
    }

    // 3. Upload tasks
    const dbTasks: DbTask[] = data.tasks.map(t => ({
      id: t.id,
      user_id: userId,
      title: t.title,
      completed_at: t.completedAt,
      archived: t.archived,
      created_at: t.createdAt
    }));
    if (dbTasks.length > 0) {
      await supabase.from("tasks").upsert(dbTasks);
    }
    
    // We optionally generate task_logs for already completed tasks, 
    // but simply upserting them based on completedAt is safe.
    const dbTaskLogs = data.tasks
      .filter(t => t.completedAt)
      .map(t => ({
        task_id: t.id,
        user_id: userId,
        completed_at: t.completedAt!,
        completion_date: t.completedAt!.split('T')[0]
      }));
    if (dbTaskLogs.length > 0) {
      await supabase.from("task_logs").upsert(dbTaskLogs);
    }
  }
};
