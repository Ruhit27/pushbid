import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { BoardList, BoardTabs, ListingIcon, Pagination } from "@/app/_components/Board";
import { CategoryIcon } from "@/app/_components/CategoryIcon";
import { CategoryStrip } from "@/app/_components/CategoryStrip";
import { ClaimBox } from "@/app/_components/ClaimBox";
import { Countdown } from "@/app/_components/Countdown";
import { LatestActivity } from "@/app/_components/LatestActivity";
import {
  allTimeBoard,
  amountForFirst,
  dayBoard,
  getCategories,
  latestActivity,
  PAGE_SIZE,
  type BoardKind,
  type CategoryInfo,
} from "@/lib/boards";
import { usd } from "@/lib/format";
import { utcDay } from "@/lib/rules";
import { getViewer } from "@/lib/viewer";

type Options = {
  board: BoardKind;
  category?: CategoryInfo;
  page: number;
  amount?: number;
};

/** The shared shape of the home, Today and Category pages: Claim box, Board, and a sidebar. */
export async function BoardPage({ board, category, page, amount }: Options) {
  const today = utcDay(new Date());
  const base = category ? `/category/${category.slug}` : "";
  const boardHref = board === "today" ? (base ? `${base}?board=today` : "/today") : base || "/";
  const todayHref = base ? `${base}?board=today` : "/today";

  const [categories, viewer, firstAmount, activity, main, todayTop] = await Promise.all([
    getCategories(),
    getViewer(),
    amountForFirst(board, category?.id),
    latestActivity(5),
    board === "today"
      ? dayBoard(today, { categoryId: category?.id }).then((b) => ({ ...b, page: 1, pages: 1 }))
      : allTimeBoard({ categoryId: category?.id, page }),
    board === "all-time" ? dayBoard(today, { categoryId: category?.id, limit: 5 }) : null,
  ]);

  const withParam = (href: string, key: string, value: string | number) => `${href}${href.includes("?") ? "&" : "?"}${key}=${value}`;
  const claimHref = (amt: number) => `${withParam(boardHref, "amount", amt)}#claim`;

  return (
    <div className="grid grid-cols-1 gap-10">
      <CategoryStrip categories={categories} active={category?.slug} />

      <div className="grid justify-items-center gap-3 text-center">
        {category && (
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
              <CategoryIcon icon={category.icon} size={18} />
            </span>
            {category.name}
          </h1>
        )}
        <BoardTabs active={board} base={base} />
        <p className="text-sm text-muted">
          {board === "today" && (
            <>
              Resets every day at midnight UTC · <Countdown /> left ·{" "}
            </>
          )}
          <Link href={category ? `/daily?category=${category.slug}` : "/daily"} className="hover:text-fg">
            Daily archive →
          </Link>
        </p>
      </div>

      <ClaimBox
        key={`${board}-${category?.id ?? "all"}-${amount ?? ""}`}
        categories={categories}
        firstAmount={firstAmount}
        initialAmount={amount}
        board={board}
        defaultCategoryId={category?.id}
        signedIn={!!viewer}
        credits={viewer?.credits ?? 0}
        signInNext={boardHref}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <BoardList
            rows={main.rows}
            claimHref={claimHref}
            empty={board === "today" ? "Nobody has claimed a rank since midnight UTC. $10 takes today's #1." : "No listings yet. Be the first."}
          />
          {board === "all-time" && (
            <>
              <Pagination page={main.page} pages={main.pages} href={(p) => (p === 1 ? boardHref : withParam(boardHref, "page", p))} />
              {main.total > 0 && (
                <p className="mt-3 text-center text-xs text-muted">
                  {(main.page - 1) * PAGE_SIZE + 1} – {Math.min(main.total, main.page * PAGE_SIZE)} of {main.total.toLocaleString("en-US")}
                </p>
              )}
            </>
          )}
        </div>
        <aside className="grid content-start gap-10">
          {todayTop && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <span className="h-2 w-2 rounded-full bg-brand" /> Today&apos;s ranking
                </h2>
                <Link href={todayHref} className="flex items-center text-sm font-medium text-brand hover:underline">
                  See all <ChevronRight size={16} />
                </Link>
              </div>
              {todayTop.rows.length ? (
                <ol className="mt-4 grid gap-4">
                  {todayTop.rows.map((r) => (
                    <li key={r.id}>
                      <Link href={`/product/${r.slug}`} className="group flex items-center gap-3">
                        <span className="w-7 text-sm font-semibold text-muted tabular-nums">#{r.rank}</span>
                        <ListingIcon src={r.iconUrl} size={36} rounded="rounded-full" />
                        <span className="min-w-0 flex-1 truncate font-medium group-hover:text-brand">{r.title}</span>
                        <span className="font-semibold text-brand tabular-nums">{usd(r.spend)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-muted">Nobody has claimed today yet. $10 takes #1.</p>
              )}
            </section>
          )}
          <LatestActivity items={activity} />
        </aside>
      </div>
    </div>
  );
}

export function parsePositiveInt(value: string | string[] | undefined): number | undefined {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
