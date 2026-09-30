"use client";

import { useActionState } from "react";
import { deleteCategory, saveCategory } from "../../actions";

const input = "min-w-0 rounded-lg border border-line bg-bg px-2.5 py-2 text-sm outline-none focus:border-brand";

type Cat = { id: string; name: string; shortName: string; slug: string; order: number };

export function CategoryRow({ category, listings }: { category: Cat; listings: number }) {
  const [saved, save, saving] = useActionState(saveCategory, {});
  const [deleted, remove, removing] = useActionState(deleteCategory, {});
  const message = saved.error ?? deleted.error ?? saved.ok;
  return (
    <div className="rounded-xl border border-line bg-surface p-2">
      <form action={save} className="grid gap-2 md:grid-cols-[1fr_140px_1fr_70px_60px_auto] md:items-center">
        <input type="hidden" name="id" value={category.id} />
        <input name="name" defaultValue={category.name} className={input} aria-label="Name" />
        <input name="shortName" defaultValue={category.shortName} className={input} aria-label="Short name" />
        <input name="slug" defaultValue={category.slug} className={input} aria-label="Slug" />
        <input name="order" type="number" defaultValue={category.order} className={input} aria-label="Order" />
        <span className="px-1 text-sm tabular-nums text-muted">{listings}</span>
        <div className="flex gap-1">
          <button disabled={saving} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:border-fg">
            Save
          </button>
          <button
            formAction={remove}
            disabled={removing}
            onClick={(e) => {
              if (!confirm(`Delete category "${category.name}"?`)) e.preventDefault();
            }}
            className="rounded-lg border border-line px-3 py-2 text-xs text-red-600 hover:border-red-500"
          >
            Delete
          </button>
        </div>
      </form>
      {message && <p className={`mt-1 px-1 text-xs ${saved.ok && !saved.error && !deleted.error ? "text-muted" : "text-red-600"}`}>{message}</p>}
    </div>
  );
}

export function NewCategory() {
  const [state, action, pending] = useActionState(saveCategory, {});
  return (
    <form action={action} className="grid gap-2 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_160px_1fr_80px_auto] md:items-end">
      <label className="grid gap-1 text-xs text-muted">
        Name
        <input name="name" required placeholder="Developer Tools" className={input} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Short name
        <input name="shortName" placeholder="Developer" className={input} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Slug (optional)
        <input name="slug" placeholder="developer-tools" className={input} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Order
        <input name="order" type="number" defaultValue={100} className={input} />
      </label>
      <button disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-strong">
        Add category
      </button>
      {(state.error || state.ok) && <p className={`text-xs md:col-span-5 ${state.error ? "text-red-600" : "text-muted"}`}>{state.error ?? state.ok}</p>}
    </form>
  );
}
