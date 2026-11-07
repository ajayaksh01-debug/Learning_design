"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import { recordStopCompletion } from "@/lib/streak";

export async function submitArtifact(stopId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Write something before submitting." };

  const user = await getCurrentUser();

  const existingProgress = await db.progress.findUnique({
    where: { userId_stopId: { userId: user.id, stopId } },
  });

  await db.artifactSub.create({
    data: { userId: user.id, stopId, body: trimmed },
  });

  if (!existingProgress) {
    await db.progress.create({ data: { userId: user.id, stopId } });
    await recordStopCompletion(user.id);
  }

  revalidatePath("/");
  revalidatePath("/stop/" + stopId);
  revalidatePath("/log");

  return { ok: true };
}
