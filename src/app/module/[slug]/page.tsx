import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const module_ = await db.module.findUnique({
    where: { slug },
    include: {
      stage: true,
      stops: {
        orderBy: { order: "asc" },
        include: { progress: { where: { userId: user.id } } },
      },
    },
  });

  if (!module_) notFound();

  const completedCount = module_.stops.filter((s) => s.progress.length > 0).length;
  const hasIncomplete = completedCount < module_.stops.length;
  const diagnosticEligible = module_.stage.order <= 2 && hasIncomplete;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← {module_.stage.title}
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{module_.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {completedCount} / {module_.stops.length} stops complete
          </p>
        </div>
        {diagnosticEligible && (
          <Link
            href={`/module/${module_.slug}/diagnostic`}
            className="rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:border-orange-400"
          >
            Take diagnostic
          </Link>
        )}
      </div>

      <ol className="mt-6 space-y-2">
        {module_.stops.map((stop, i) => {
          const progress = stop.progress[0];
          const done = !!progress;
          const skipped = progress?.skipped ?? false;
          return (
            <li key={stop.id}>
              <Link
                href={`/stop/${stop.id}`}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition hover:border-zinc-300 ${
                  done
                    ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {done ? (skipped ? "–" : "✓") : i + 1}
                  </span>
                  <span className={done ? "line-through" : "font-medium"}>
                    {stop.title}
                  </span>
                  {skipped && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      skipped
                    </span>
                  )}
                </span>
                <span className="text-sm text-zinc-500">~{stop.estMinutes} min</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
