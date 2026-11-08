import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import { DiagnosticQuiz } from "./diagnostic-quiz";

export const dynamic = "force-dynamic";

const DIAGNOSTIC_QUESTION_COUNT = 6;

export default async function DiagnosticPage({
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
        include: {
          quizItems: true,
          progress: { where: { userId: user.id } },
        },
      },
    },
  });

  if (!module_) notFound();
  if (module_.stage.order > 2) notFound();

  const incompleteStops = module_.stops.filter((s) => s.progress.length === 0);

  // One question per incomplete stop where possible, up to the cap.
  const questions = incompleteStops
    .filter((s) => s.quizItems.length > 0)
    .slice(0, DIAGNOSTIC_QUESTION_COUNT)
    .map((s) => {
      const q = s.quizItems[0];
      return {
        id: q.id,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
        stopTitle: s.title,
      };
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/module/${slug}`}
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← {module_.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Diagnostic: {module_.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        If you can already answer these cold, skip the stops below instead of
        reading them. Be honest with yourself — this only works if it does.
      </p>

      {questions.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Nothing left to diagnose — every stop here is already complete.
        </p>
      ) : (
        <div className="mt-6">
          <DiagnosticQuiz moduleSlug={slug} questions={questions} />
        </div>
      )}
    </div>
  );
}
