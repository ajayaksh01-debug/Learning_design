import { db } from "@/lib/db";
import { DEFAULT_USER_EMAIL } from "@/lib/constants";

export async function getCurrentUser() {
  return db.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL },
  });
}
