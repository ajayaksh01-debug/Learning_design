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
      stops: {
        orderBy: { order: "asc" },
        include: { progress: { where: { userId: user.id } } },
      },
    },
  });

  if (!module_) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{module_.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {module_.stops.filter((s) => s.progress.length > 0).length} /{" "}
        {module_.stops.length} stops complete
      </p>

      <ol className="mt-6 space-y-2">
        {module_.stops.map((stop, i) => {
          const done = stop.progress.length > 0;
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
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={done ? "line-through" : "font-medium"}>
                    {stop.title}
                  </span>
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
