"use client";

import { useActionState } from "react";
import { setCredits } from "../../actions";

export function CreditsForm({ id, credits }: { id: string; credits: number }) {
  const [state, action, pending] = useActionState(setCredits, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-muted">$</span>
      <input
        name="credits"
        type="number"
        min={0}
        step={1}
        defaultValue={credits}
        className="w-28 rounded-lg border border-line bg-bg px-2 py-1.5 tabular-nums outline-none focus:border-brand"
        aria-label="Credits"
      />
      <button disabled={pending} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-fg">
        Set
      </button>
      {(state.ok || state.error) && <span className={`text-xs ${state.error ? "text-red-600" : "text-muted"}`}>{state.error ?? state.ok}</span>}
    </form>
  );
}
