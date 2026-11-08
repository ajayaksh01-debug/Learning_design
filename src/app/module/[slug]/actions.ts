"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";

export async function skipRemainingStops(moduleSlug: string) {
  const user = await getCurrentUser();

  const module_ = await db.module.findUnique({
    where: { slug: moduleSlug },
    include: { stops: { include: { progress: { where: { userId: user.id } } } } },
  });
  if (!module_) return { ok: false };

  const toSkip = module_.stops.filter((s) => s.progress.length === 0);
  if (toSkip.length > 0) {
    await db.progress.createMany({
      data: toSkip.map((s) => ({ userId: user.id, stopId: s.id, skipped: true })),
    });
  }

  revalidatePath("/");
  revalidatePath(`/module/${moduleSlug}`);

  return { ok: true, skippedCount: toSkip.length };
}
