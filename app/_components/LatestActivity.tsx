import Link from "next/link";
import type { ActivityItem } from "@/lib/boards";
import { timeAgo, usd } from "@/lib/format";
import { ListingIcon } from "./Board";

export function LatestActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        Latest activity
      </h2>
      {items.length ? (
        <ul className="mt-3 grid gap-3">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/product/${a.listing.slug}`} className="flex items-center gap-3 rounded-lg hover:bg-surface-2">
                <ListingIcon src={a.listing.iconUrl} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{a.listing.title}</span>
                  <span className="block text-xs text-muted">
                    at #{a.rankAfter} · <span className="font-semibold text-fg">{usd(a.amount)}</span> · {timeAgo(a.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No Claims yet.</p>
      )}
    </section>
  );
}
