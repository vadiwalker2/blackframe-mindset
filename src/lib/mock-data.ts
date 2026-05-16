export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Routine {
  id: string;
  title: string;
  time: string; // HH:MM
  days: Weekday[]; // 0=Sun..6=Sat
  completedToday: boolean;
  streak: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  carriedOver?: boolean;
}

export const MOCK_ROUTINES: Routine[] = [
  { id: "r1", title: "Cold shower", time: "06:30", days: [0,1,2,3,4,5,6], completedToday: true, streak: 14 },
  { id: "r2", title: "Deep work — 90 min", time: "08:00", days: [1,2,3,4,5], completedToday: true, streak: 9 },
  { id: "r3", title: "Train", time: "17:30", days: [1,3,5], completedToday: false, streak: 22 },
  { id: "r4", title: "Read 20 pages", time: "21:00", days: [0,1,2,3,4,5,6], completedToday: false, streak: 31 },
  { id: "r5", title: "Plan tomorrow", time: "22:30", days: [0,1,2,3,4,5,6], completedToday: false, streak: 6 },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Ship onboarding flow", completed: false, createdAt: new Date().toISOString() },
  { id: "t2", title: "Reply to investor email", completed: true, createdAt: new Date().toISOString() },
  { id: "t3", title: "Review Q1 metrics", completed: false, createdAt: new Date(Date.now() - 86400000).toISOString(), carriedOver: true },
  { id: "t4", title: "Renew domain", completed: false, createdAt: new Date().toISOString() },
];

export const QUOTES = [
  "Discipline equals freedom.",
  "Small steps every day.",
  "You become what you repeat.",
  "Make the hard thing routine.",
  "Show up. Especially today.",
  "The standard is the standard.",
];

export function getQuoteOfDay() {
  const idx = new Date().getDate() % QUOTES.length;
  return QUOTES[idx];
}

export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
