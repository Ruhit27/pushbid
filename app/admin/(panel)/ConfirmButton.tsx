"use client";

import { useFormStatus } from "react-dom";

/** A destructive submit button that asks before submitting its form. */
export function ConfirmButton({ message, children, className }: { message: string; children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={className ?? "rounded-xl border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50"}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
