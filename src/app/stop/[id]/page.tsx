import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import { QuizList } from "./quiz";
import { ArtifactForm } from "./artifact-form";
import { RevealGate } from "./reveal-gate";

export const dynamic = "force-dynamic";

export default async function StopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const stop = await db.stop.findUnique({
    where: { id },
    include: {
      module: true,
      quizItems: true,
      progress: { where: { userId: user.id } },
      artifacts: {
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!stop) notFound();

  const alreadyDone = stop.progress.length > 0;
  const latestSubmission = stop.artifacts[0]?.body ?? "";

  const quizItems = stop.quizItems.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
    answer: q.answer,
    explanation: q.explanation,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/module/${stop.module.slug}`}
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← {stop.module.title}
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{stop.title}</h1>
        {alreadyDone && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Complete
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-500">~{stop.estMinutes} min read</p>

      <article className="prose prose-zinc prose-sm mt-6 max-w-none rounded-lg border border-zinc-200 bg-white p-5 prose-table:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{stop.contentMd}</ReactMarkdown>
      </article>

      <div className="mt-6">
        <RevealGate startOpen={alreadyDone}>
          {quizItems.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Check yourself
              </h2>
              <QuizList items={quizItems} />
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Your task
            </h2>
            <ArtifactForm
              stopId={stop.id}
              prompt={stop.artifactPrompt}
              initialBody={latestSubmission}
              alreadyDone={alreadyDone}
            />
          </div>
        </RevealGate>
      </div>
    </div>
  );
}
