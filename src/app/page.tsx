import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import { getCurrentStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getCurrentUser();

  const modules = await db.module.findMany({
    orderBy: { order: "asc" },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: {
          progress: { where: { userId: user.id } },
        },
      },
    },
  });

  const streak = await getCurrentStreak(user.id);

  const allStops = modules.flatMap((m) => m.stops);
  const totalStops = allStops.length;
  const completedStops = allStops.filter((s) => s.progress.length > 0).length;
  const nextStop = allStops.find((s) => s.progress.length === 0);
  const nextStopModule = nextStop
    ? modules.find((m) => m.stops.some((s) => s.id === nextStop.id))
    : undefined;

  if (totalStops === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold">No content seeded yet</h1>
        <p className="mt-2 text-zinc-600">
          Run <code className="rounded bg-zinc-100 px-1.5 py-0.5">npm run db:seed</code>{" "}
          once content/seed/*.json files exist.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold">Your path</h1>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-600">{streak}</div>
          <div className="text-xs text-zinc-500">day streak</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-zinc-900"
            style={{ width: `${Math.round((completedStops / totalStops) * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {completedStops} / {totalStops} stops complete
        </p>
      </div>

      {nextStop && nextStopModule ? (
        <Link
          href={`/stop/${nextStop.id}`}
          className="mt-6 block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Next stop · {nextStopModule.title}
          </p>
          <p className="mt-1 text-lg font-semibold">{nextStop.title}</p>
          <p className="mt-1 text-sm text-zinc-500">~{nextStop.estMinutes} min</p>
        </Link>
      ) : (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
          <p className="font-semibold">All stops complete. Nice.</p>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold">Modules</h2>
      <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {modules.map((m) => {
          const total = m.stops.length;
          const done = m.stops.filter((s) => s.progress.length > 0).length;
          return (
            <li key={m.id}>
              <Link
                href={`/module/${m.slug}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50"
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-sm text-zinc-500">
                  {done}/{total}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
