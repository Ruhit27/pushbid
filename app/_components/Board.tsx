import Link from "next/link";
import type { BoardRow } from "@/lib/boards";
import { compact, timeAgo, usd } from "@/lib/format";
import { amountToTakeRank } from "@/lib/rules";

export function ListingIcon({ src, size = 40 }: { src: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-lg border border-line bg-surface object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <span className="shrink-0 rounded-lg bg-surface-2" style={{ width: size, height: size }} />
  );
}

const medal = ["text-gold", "text-muted", "text-[#b0703c]"];

/** One ranked Listing. `claimHref` builds the link that prefills the Claim box with this Rank's price. */
export function BoardItem({ row, claimHref }: { row: BoardRow; claimHref?: (amount: number) => string }) {
  const amount = amountToTakeRank(row.rank, row.spend);
  const top = row.rank <= 3;
  return (
    <li
      id={`rank-${row.slug}`}
      className={`group relative rounded-2xl border bg-surface p-4 transition hover:border-brand/60 ${
        row.rank === 1 ? "border-brand/50 shadow-[0_0_0_4px_var(--brand-soft)]" : "border-line"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`w-10 shrink-0 pt-2 text-right text-sm font-extrabold tabular-nums ${top ? medal[row.rank - 1] : "text-muted"}`}>
          #{row.rank}
        </span>
        <a href={`/go/${row.id}`} target="_blank" rel="noopener" className="shrink-0" aria-label={`Open ${row.title}`}>
          <ListingIcon src={row.iconUrl} size={top ? 48 : 40} />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <a href={`/go/${row.id}`} target="_blank" rel="noopener" className={`font-bold leading-snug hover:text-brand ${top ? "text-lg" : ""}`}>
              {row.title}
            </a>
            <span className={`shrink-0 font-extrabold tabular-nums ${row.rank === 1 ? "text-xl text-brand" : "text-lg"}`}>{usd(row.spend)}</span>
          </div>
          {row.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{row.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {row.category && (
              <Link href={`/category/${row.category.slug}`} className="rounded-full bg-surface-2 px-2 py-0.5 hover:text-fg">
                {row.category.shortName}
              </Link>
            )}
            <span>{timeAgo(row.createdAt)}</span>
            <span>·</span>
            <span>{row.host}</span>
            <span>·</span>
            <span>{compact(row.clicks)} clicks</span>
            <span>·</span>
            <Link href={`/product/${row.slug}`} className="underline-offset-2 hover:text-fg hover:underline">
              see details
            </Link>
            {claimHref && (
              <Link
                href={claimHref(amount)}
                className="ml-auto rounded-full border border-line px-2.5 py-1 font-semibold text-fg transition hover:border-brand hover:bg-brand hover:text-white"
              >
                claim this rank for {usd(amount)}
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function BoardList({ rows, claimHref, empty }: { rows: BoardRow[]; claimHref?: (amount: number) => string; empty?: React.ReactNode }) {
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">{empty ?? "Nobody here yet."}</div>;
  return (
    <ol className="grid gap-2.5">
      {rows.map((r) => (
        <BoardItem key={r.id} row={r} claimHref={claimHref} />
      ))}
    </ol>
  );
}

export function BoardTabs({ active, base = "" }: { active: "all-time" | "today"; base?: string }) {
  const tab = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? "bg-fg text-bg" : "text-muted hover:text-fg"}`;
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1">
      <Link href={base || "/"} className={tab(active === "all-time")}>
        All-time
      </Link>
      <Link href={base ? `${base}?board=today` : "/today"} className={tab(active === "today")}>
        Today
      </Link>
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages])).filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  return (
    <nav className="mt-6 flex items-center justify-center gap-1 text-sm">
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && p - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(p)}
            className={`min-w-9 rounded-lg border px-2.5 py-1.5 text-center tabular-nums ${p === page ? "border-fg bg-fg text-bg" : "border-line hover:border-fg"}`}
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
