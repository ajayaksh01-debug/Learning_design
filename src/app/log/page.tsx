import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const user = await getCurrentUser();

  const submissions = await db.artifactSub.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { stop: { include: { module: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Your log</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every artifact you've written, newest first. This is your interview-prep
        log and the start of your portfolio.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Nothing yet — complete a stop to see it here.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <Link
                  href={`/stop/${sub.stopId}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {sub.stop.title}
                </Link>
                <span className="text-xs text-zinc-500">
                  {sub.createdAt.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{sub.stop.module.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {sub.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
