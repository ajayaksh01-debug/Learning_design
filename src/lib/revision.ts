import { db } from "@/lib/db";
import { todayKey } from "@/lib/streak";

const REVISION_DELAY_DAYS = 3;

export type RevisionItem = {
  id: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  stopTitle: string;
  stopId: string;
};

/**
 * A small set of quiz items from stops completed a few days ago, for
 * lightweight spaced revision on the dashboard. Not a full SRS: no
 * per-item scheduling or tracking of what's been re-shown, just a
 * deterministic-per-day sample so the same handful shows all day.
 */
export async function getDailyRevisionItems(
  userId: string,
  count = 3
): Promise<RevisionItem[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REVISION_DELAY_DAYS);

  const progressRows = await db.progress.findMany({
    where: { userId, skipped: false, completedAt: { lte: cutoff } },
    select: { stopId: true },
  });
  const stopIds = progressRows.map((p) => p.stopId);
  if (stopIds.length === 0) return [];

  const quizItems = await db.quizItem.findMany({
    where: { stopId: { in: stopIds } },
    include: { stop: { select: { id: true, title: true } } },
  });
  if (quizItems.length === 0) return [];

  const seed = seedFromString(todayKey());
  const shuffled = seededShuffle(quizItems, seed);

  return shuffled.slice(0, count).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
    answer: q.answer,
    explanation: q.explanation,
    stopTitle: q.stop.title,
    stopId: q.stop.id,
  }));
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let state = seed || 1;
  const rand = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
