import Link from "next/link";
import { ListingIcon } from "@/app/_components/Board";
import { getCategories } from "@/lib/boards";
import { connectDb } from "@/lib/db";
import { compact, usd } from "@/lib/format";
import { Listing, type ListingDoc } from "@/lib/models";
import { toggleHidden } from "../../actions";

export default async function AdminListings({ searchParams }: PageProps<"/admin/listings">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  await connectDb();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = q ? { $or: [{ title: { $regex: escaped, $options: "i" } }, { key: { $regex: escaped, $options: "i" } }] } : {};
  const [listings, categories] = await Promise.all([
    Listing.find(filter).sort({ totalSpend: -1, spendSince: 1 }).limit(300).lean<ListingDoc[]>(),
    getCategories(),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.shortName]));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
        <div className="flex gap-2">
          <form>
            <input name="q" defaultValue={q} placeholder="Search title or link" className="rounded-full border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
          </form>
          <Link href="/admin/listings/new" className="rounded-full bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong">
            + Add listing
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2">Listing</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Spend</th>
              <th className="px-4 py-2 text-right">Clicks</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l._id.toString()} className={`border-t border-line ${l.hidden ? "opacity-60" : ""}`}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <ListingIcon src={l.iconUrl} size={28} />
                    <div className="min-w-0">
                      <p className="max-w-xs truncate font-semibold">{l.title}</p>
                      <p className="max-w-xs truncate text-xs text-muted">{l.key}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">{catName.get(l.category.toString()) ?? "—"}</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums">{usd(l.totalSpend)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{compact(l.clicks)}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {l.hidden && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">hidden</span>}
                    {l.demo && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-strong">demo</span>}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <form action={toggleHidden}>
                      <input type="hidden" name="id" value={l._id.toString()} />
                      <button className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-fg">{l.hidden ? "Show" : "Hide"}</button>
                    </form>
                    <Link href={`/admin/listings/${l._id}`} className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-fg">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!listings.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No listings{q ? ` match "${q}"` : " yet"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
