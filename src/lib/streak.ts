import { db } from "@/lib/db";

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateKeyMinusDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - days);
  return todayKey(dt);
}

export async function recordStopCompletion(userId: string, date = new Date()) {
  const key = todayKey(date);
  await db.streakDay.upsert({
    where: { userId_date: { userId, date: key } },
    update: { stopsCompleted: { increment: 1 } },
    create: { userId, date: key, stopsCompleted: 1 },
  });
}

/**
 * Current streak = consecutive days with stopsCompleted > 0, walking
 * backwards from today. A day with zero completions breaks it. If today
 * has no completions yet, the streak still counts from yesterday backwards
 * (so it doesn't reset to 0 the moment the clock rolls over, only once a
 * full day passes with nothing done).
 */
export async function getCurrentStreak(userId: string): Promise<number> {
  const days = await db.streakDay.findMany({
    where: { userId, stopsCompleted: { gt: 0 } },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const activeDates = new Set(days.map((d) => d.date));

  let cursor = todayKey();
  if (!activeDates.has(cursor)) {
    cursor = dateKeyMinusDays(cursor, 1);
    if (!activeDates.has(cursor)) return 0;
  }

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = dateKeyMinusDays(cursor, 1);
  }
  return streak;
}
