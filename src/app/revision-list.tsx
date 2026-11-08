"use client";

import Link from "next/link";
import { useState } from "react";

type RevisionItemData = {
  id: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  stopTitle: string;
  stopId: string;
};

export function RevisionList({ items }: { items: RevisionItemData[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4">
          <Link
            href={`/stop/${item.stopId}`}
            className="text-xs font-medium uppercase tracking-wide text-zinc-400 hover:text-zinc-600"
          >
            {item.stopTitle}
          </Link>
          <p className="mt-1 font-medium">{item.question}</p>
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
