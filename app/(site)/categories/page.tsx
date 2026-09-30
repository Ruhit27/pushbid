import type { Metadata } from "next";
import Link from "next/link";
import { ListingIcon } from "@/app/_components/Board";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { categoryOverview } from "@/lib/boards";
import { timeAgo, usd } from "@/lib/format";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await categoryOverview();
  const active = categories.filter((c) => c.claims > 0).slice(0, 3);
  return (
    <div className="grid gap-10">
      <header>
        <h1 className="text-5xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-3 text-lg text-muted">Each category has its own Boards. Pick one to see who&apos;s on top.</p>
      </header>

      {active.length > 0 && (
        <section className="rounded-[32px] bg-surface-2 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand" /> Most active categories
          </h2>
          <p className="mt-1 text-muted">Where Claims are happening this week, and who leads each one.</p>
          <ol className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {active.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className={`block h-full rounded-3xl border bg-surface p-4 transition hover:border-brand ${i === 0 ? "border-brand/60" : "border-line"}`}
                >
                  <div className="flex items-start gap-3">
                    <CategoryIcon icon={c.icon} size={24} className="mt-1 text-brand" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-brand uppercase">
                        #{i + 1}
                        {i === 0 ? " hottest" : ""}
                      </p>
                      <p className="truncate text-lg font-semibold">{c.name}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-muted">
                    <span>
                      <span className="font-semibold text-fg">{c.claims}</span> claim{c.claims === 1 ? "" : "s"}
                    </span>
                    <span>{c.lastClaim ? timeAgo(c.lastClaim) : ""}</span>
                  </div>
                  {c.leaders[0] && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <ListingIcon src={c.leaders[0].iconUrl} size={28} rounded="rounded-full" />
                      <span className="min-w-0 flex-1 truncate text-muted">
                        Leading <span className="font-medium text-fg">{c.leaders[0].title}</span>
                      </span>
                      <span className="font-semibold text-brand tabular-nums">{usd(c.leaders[0].spend)}</span>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="rounded-[32px] border border-line bg-surface p-6 transition hover:border-brand">
            <div className="flex items-center gap-3">
              <CategoryIcon icon={c.icon} size={30} className="text-brand" />
              <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{c.name}</h2>
              <span className="text-sm text-muted tabular-nums">{c.count}</span>
            </div>
            <div className="mt-5 rounded-3xl bg-surface-2 p-3">
              {c.leaders.length ? (
                <ol className="grid gap-2">
                  {c.leaders.map((r) => (
                    <li key={r.id} className="flex items-center gap-2.5 text-sm">
                      <span className="w-7 font-semibold text-muted tabular-nums">#{r.rank}</span>
                      <ListingIcon src={r.iconUrl} size={30} rounded="rounded-full" />
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="font-semibold text-brand tabular-nums">{usd(r.spend)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-1 py-2 text-sm text-muted">Empty. $10 takes #1.</p>
              )}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
