"use client";

import { useState } from "react";

type QuizItemData = {
  id: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
};

export function QuizList({ items }: { items: QuizItemData[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="font-medium">
            {i + 1}. {item.question}
          </p>
          {item.options && (
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {item.options.map((opt) => (
                <li key={opt}>• {opt}</li>
              ))}
            </ul>
          )}
          {revealed[item.id] ? (
            <div className="mt-3 rounded-md bg-zinc-50 p-3 text-sm">
              <p className="font-semibold text-zinc-900">Answer: {item.answer}</p>
              <p className="mt-1 text-zinc-600">{item.explanation}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed((r) => ({ ...r, [item.id]: true }))}
              className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Reveal answer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
