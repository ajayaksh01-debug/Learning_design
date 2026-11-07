"use client";

import { useState } from "react";

export function RevealGate({
  children,
  startOpen,
}: {
  children: React.ReactNode;
  startOpen: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:border-zinc-400"
      >
        Mark read — show quiz & task
      </button>
    );
  }

  return <div className="space-y-6">{children}</div>;
}
