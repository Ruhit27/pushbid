"use client";

import { useActionState } from "react";
import type { CategoryInfo } from "@/lib/boards";
import { saveListing } from "../../actions";

export type ListingFormValues = {
  id?: string;
  url: string;
  title: string;
  description: string;
  iconUrl: string;
  category: string;
  totalSpend: number;
  hidden: boolean;
  demo: boolean;
};

const input = "rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand";

export function ListingForm({ values, categories }: { values: ListingFormValues; categories: CategoryInfo[] }) {
  const [state, action, pending] = useActionState(saveListing, {});
  return (
    <form action={action} className="grid max-w-2xl gap-4 rounded-2xl border border-line bg-surface p-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <label className="grid gap-1 text-sm font-medium">
        Link (website or @handle)
        <input name="url" defaultValue={values.url} required className={input} placeholder="https://example.com" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Title
        <input name="title" defaultValue={values.title} required maxLength={120} className={input} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Description
        <textarea name="description" defaultValue={values.description} maxLength={300} rows={3} className={input} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Icon image link
        <input name="iconUrl" defaultValue={values.iconUrl} className={input} placeholder="Leave empty to use the site's favicon" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Category
          <select name="category" defaultValue={values.category} required className={input}>
            <option value="">Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          All-time Spend ($)
          <input name="totalSpend" type="number" min={0} step={1} defaultValue={values.totalSpend} required className={input} />
        </label>
      </div>
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="hidden" defaultChecked={values.hidden} /> Hidden from the board
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="demo" defaultChecked={values.demo} /> Demo listing
        </label>
      </div>
      <p className="text-xs text-muted">
        Setting Spend here changes the All-time board only. Today and Daily boards count real Claims.
      </p>
      {state.error && <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-strong">{state.error}</p>}
      <div>
        <button disabled={pending} className="rounded-xl bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? "Saving…" : values.id ? "Save changes" : "Add listing"}
        </button>
      </div>
    </form>
  );
}
