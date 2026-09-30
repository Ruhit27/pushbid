import type { Metadata } from "next";
import Link from "next/link";
import { ListingIcon } from "@/app/_components/Board";
import { categoryOverview } from "@/lib/boards";
import { timeAgo, usd } from "@/lib/format";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await categoryOverview();
  const active = categories.filter((c) => c.claims > 0).slice(0, 3);
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Categories</h1>
        <p className="mt-1 text-muted">Each category has its own Boards. Pick one to see who leads it.</p>
      </header>

      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Most active this week</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {active.map((c, i) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-brand">
                  <p className="text-xs font-bold text-brand">#{i + 1}{i === 0 ? " hottest" : ""}</p>
                  <p className="mt-1 font-bold">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.claims} claim{c.claims === 1 ? "" : "s"} · {c.lastClaim ? timeAgo(c.lastClaim) : ""}
                  </p>
                  {c.leaders[0] && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <ListingIcon src={c.leaders[0].iconUrl} size={24} />
                      <span className="min-w-0 flex-1 truncate">{c.leaders[0].title}</span>
                      <span className="font-bold tabular-nums">{usd(c.leaders[0].spend)}</span>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="rounded-2xl border border-line bg-surface p-4 hover:border-brand">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-bold">{c.name}</h2>
              <span className="text-xs text-muted">{c.count}</span>
            </div>
            {c.leaders.length ? (
              <ol className="mt-3 grid gap-2">
                {c.leaders.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-xs font-bold text-muted">#{r.rank}</span>
                    <ListingIcon src={r.iconUrl} size={20} />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <span className="font-semibold tabular-nums">{usd(r.spend)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">Empty. $10 takes #1.</p>
            )}
          </Link>
        ))}
      </section>
    </div>
  );
}
