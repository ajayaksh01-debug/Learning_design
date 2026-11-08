"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { skipRemainingStops } from "../actions";

type Question = {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  stopTitle: string;
};

export function DiagnosticQuiz({
  moduleSlug,
  questions,
}: {
  moduleSlug: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [skipping, setSkipping] = useState(false);
  const [done, setDone] = useState(false);

  const answeredCount = Object.keys(marks).length;
  const allAnswered = answeredCount === questions.length;
  const correctCount = useMemo(
    () => Object.values(marks).filter(Boolean).length,
    [marks]
  );
  const scorePct = allAnswered
    ? Math.round((correctCount / questions.length) * 100)
    : null;

  async function handleSkip() {
    setSkipping(true);
    await skipRemainingStops(moduleSlug);
    setSkipping(false);
    setDone(true);
    router.push(`/module/${moduleSlug}`);
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {q.stopTitle}
          </p>
          <p className="mt-1 font-medium">
            {i + 1}. {q.question}
          </p>

          {revealed[q.id] ? (
            <>
              <div className="mt-3 rounded-md bg-zinc-50 p-3 text-sm">
                <p className="font-semibold text-zinc-900">Answer: {q.answer}</p>
                <p className="mt-1 text-zinc-600">{q.explanation}</p>
              </div>
              {marks[q.id] === undefined && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMarks((m) => ({ ...m, [q.id]: true }))}
                    className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:border-green-400"
                  >
                    I knew this
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarks((m) => ({ ...m, [q.id]: false }))}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
                  >
                    I didn't know this
                  </button>
                </div>
              )}
              {marks[q.id] !== undefined && (
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  {marks[q.id] ? "Marked: knew it" : "Marked: gap found"}
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
              className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Say your answer out loud, then reveal
            </button>
          )}
        </div>
      ))}

      {allAnswered && !done && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-lg font-semibold">
            {correctCount} / {questions.length} ({scorePct}%)
          </p>
          {scorePct !== null && scorePct >= 70 ? (
            <>
              <p className="mt-1 text-sm text-zinc-600">
                Solid. You can skip the stops you got right instead of reading
                them end to end.
              </p>
              <button
                type="button"
                onClick={handleSkip}
                disabled={skipping}
                className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {skipping ? "Skipping…" : "Skip remaining stops in this module"}
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm text-zinc-600">
              Below 70% — worth reading through properly rather than skipping.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
