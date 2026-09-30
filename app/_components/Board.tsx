import { Trophy } from "lucide-react";
import Link from "next/link";
import type { BoardKind, BoardRow } from "@/lib/boards";
import { compact, timeAgo, usd } from "@/lib/format";
import { amountToTakeRank } from "@/lib/rules";
import { CategoryIcon } from "./CategoryIcon";

export function ListingIcon({ src, size = 40, rounded = "rounded-xl" }: { src: string; size?: number; rounded?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`shrink-0 bg-surface object-contain ${rounded}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span className={`shrink-0 bg-surface-2 ${rounded}`} style={{ width: size, height: size }} />
  );
}

/** One ranked Listing. `claimHref` builds the link that prefills the Claim box with this Rank's amount. */
export function BoardItem({ row, claimHref }: { row: BoardRow; claimHref?: (amount: number) => string }) {
  const amount = amountToTakeRank(row.rank, row.spend);
  const top = row.rank <= 3;
  const iconSize = row.rank === 1 ? 64 : top ? 60 : 44;
  return (
    <li
      id={`rank-${row.slug}`}
      className={`group relative scroll-mt-24 rounded-3xl transition ${
        top ? "bg-brand-soft px-5 py-4" : "bg-surface-2/70 px-4 py-3 hover:bg-surface-2"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <span className={`w-8 shrink-0 text-center font-semibold tabular-nums text-brand ${top ? "text-lg" : "text-sm"}`}>#{row.rank}</span>
        <a href={`/go/${row.id}`} target="_blank" rel="noopener" className="shrink-0" aria-label={`Open ${row.title}`}>
          <ListingIcon src={row.iconUrl} size={iconSize} rounded="rounded-2xl" />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <a
              href={`/go/${row.id}`}
              target="_blank"
              rel="noopener"
              className={`truncate font-semibold transition hover:text-brand ${top ? "text-base sm:text-lg" : "text-[15px]"}`}
            >
              {row.title}
            </a>
            <span className={`shrink-0 font-semibold tabular-nums text-brand ${top ? "text-base sm:text-lg" : "text-[15px]"}`}>{usd(row.spend)}</span>
          </div>
          {row.description && <p className={`mt-0.5 truncate text-muted ${top ? "text-sm" : "text-[13px]"}`}>{row.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {row.category && (
              <Link href={`/category/${row.category.slug}`} className="flex items-center gap-1 font-semibold text-fg hover:text-brand">
                <CategoryIcon icon={row.category.icon} size={13} /> {row.category.shortName}
              </Link>
            )}
            <span aria-hidden="true">·</span>
            <span>{timeAgo(row.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-fg">{row.host}</span>
            <span aria-hidden="true">·</span>
            <span>{compact(row.clicks)} clicks</span>
            <span aria-hidden="true">·</span>
            <Link href={`/product/${row.slug}`} className="hover:text-fg">
              see details
            </Link>
          </div>
        </div>
      </div>
      {claimHref && (
        <Link
          href={claimHref(amount)}
          className="absolute right-5 -bottom-3 z-10 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus:opacity-100"
        >
          claim this rank for {usd(amount)}
        </Link>
      )}
    </li>
  );
}

export function BoardList({ rows, claimHref, empty }: { rows: BoardRow[]; claimHref?: (amount: number) => string; empty?: React.ReactNode }) {
  if (!rows.length) {
    return <div className="rounded-[28px] border border-dashed border-line p-10 text-center text-muted">{empty ?? "Nobody here yet."}</div>;
  }
  return (
    <ol className="grid gap-3">
      {rows.map((r) => (
        <BoardItem key={r.id} row={r} claimHref={claimHref} />
      ))}
    </ol>
  );
}

/** The centered All-time / Today switch. */
export function BoardTabs({ active, base = "" }: { active: BoardKind; base?: string }) {
  const tab = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-semibold transition ${on ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-brand-tint"}`;
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1">
      <Link href={base || "/"} className={tab(active === "all-time")}>
        <Trophy size={15} strokeWidth={1.75} aria-hidden="true" /> All-time
      </Link>
      <Link href={base ? `${base}?board=today` : "/today"} className={tab(active === "today")}>
        <span className={`h-2 w-2 rounded-full ${active === "today" ? "bg-white" : "bg-brand"}`} /> Today
      </Link>
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5 text-sm">
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(p)}
            className={`grid h-9 min-w-9 place-items-center rounded-full px-3 font-medium tabular-nums transition ${
              p === page ? "bg-brand text-white" : "bg-surface-2 hover:text-brand"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
