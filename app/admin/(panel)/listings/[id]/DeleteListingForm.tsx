"use client";

import { useActionState } from "react";
import { deleteListing } from "../../../actions";
import { ConfirmButton } from "../../ConfirmButton";

export function DeleteListingForm({ id, title }: { id: string; title: string }) {
  const [state, action] = useActionState(deleteListing, {});
  return (
    <form action={action} className="max-w-2xl rounded-3xl border border-red-500/30 p-5">
      <input type="hidden" name="id" value={id} />
      <h2 className="font-semibold">Delete listing</h2>
      <p className="mt-1 mb-3 text-sm text-muted">
        Removes the listing and its Claims from every Board. This only works for listings that no user has claimed on. Otherwise, hide the listing.
      </p>
      <ConfirmButton message={`Delete "${title}" and its Claims? This can't be undone.`}>Delete listing</ConfirmButton>
      {state.error && <p className="mt-3 rounded-2xl bg-brand-soft px-3 py-2 text-sm text-brand-strong">{state.error}</p>}
    </form>
  );
}
