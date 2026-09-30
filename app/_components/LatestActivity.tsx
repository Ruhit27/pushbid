import Link from "next/link";
import type { ActivityItem } from "@/lib/boards";
import { timeAgo, usd } from "@/lib/format";
import { ListingIcon } from "./Board";

export function LatestActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-semibold">
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
              <Link href={`/product/${a.listing.slug}`} className="group flex items-center gap-3">
                <ListingIcon src={a.listing.iconUrl} size={30} rounded="rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-brand">{a.listing.title}</span>
                  <span className="block text-xs text-muted">
                    at #{a.rankAfter} · <span className="font-semibold text-brand">{usd(a.amount)}</span> · {timeAgo(a.createdAt)}
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
