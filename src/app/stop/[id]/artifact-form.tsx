"use client";

import { useState, useTransition } from "react";
import { submitArtifact } from "./actions";

export function ArtifactForm({
  stopId,
  prompt,
  initialBody,
  alreadyDone,
}: {
  stopId: string;
  prompt: string;
  initialBody: string;
  alreadyDone: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      const res = await submitArtifact(stopId, body);
      if (res.ok) {
        setStatus("saved");
      } else {
        setStatus("error");
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="font-medium">{prompt}</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        placeholder="Write your answer here. This gets saved to your log."
        className="mt-3 w-full rounded-md border border-zinc-300 p-3 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {alreadyDone ? "Update submission" : "Submit & mark complete"}
        </button>
        {status === "saved" && (
          <span className="text-sm font-medium text-green-600">Saved.</span>
        )}
        {status === "error" && (
          <span className="text-sm font-medium text-red-600">{error}</span>
        )}
      </div>
    </div>
  );
}
