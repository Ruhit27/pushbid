import Link from "next/link";
import { BoardList, BoardTabs, Pagination } from "@/app/_components/Board";
import { CategoryStrip } from "@/app/_components/CategoryStrip";
import { ClaimBox } from "@/app/_components/ClaimBox";
import { Countdown } from "@/app/_components/Countdown";
import { LatestActivity } from "@/app/_components/LatestActivity";
import { allTimeBoard, dayBoard, getCategories, latestActivity, amountForFirst, PAGE_SIZE, type BoardKind, type CategoryInfo } from "@/lib/boards";
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

  const [categories, viewer, firstAmount, activity, main, todayTop] = await Promise.all([
    getCategories(),
    getViewer(),
    amountForFirst(board, category?.id),
    latestActivity(5),
    board === "today"
      ? dayBoard(today, { categoryId: category?.id }).then((b) => ({ ...b, page: 1, pages: 1 }))
      : allTimeBoard({ categoryId: category?.id, page }),
    board === "all-time" ? dayBoard(today, { categoryId: category?.id, limit: 3 }) : null,
  ]);

  const withParam = (href: string, key: string, value: string | number) =>
    `${href}${href.includes("?") ? "&" : "?"}${key}=${value}`;
  const claimHref = (amount: number) => `${withParam(boardHref, "amount", amount)}#claim`;

  return (
    <div className="grid gap-6">
      <CategoryStrip categories={categories} active={category?.slug} />

      {category && (
        <div>
          <p className="text-sm text-muted">
            <Link href="/categories" className="hover:text-fg">
              Categories
            </Link>{" "}
            /
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">{category.name}</h1>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <BoardList
            rows={main.rows}
            claimHref={claimHref}
            empty={
              board === "today"
                ? "Nobody has claimed a rank since midnight UTC. Take today's #1 for $10."
                : "No listings yet. Be the first."
            }
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
        <aside className="grid content-start gap-4">
          {todayTop && (
            <section className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Today&apos;s ranking</h2>
                <Link href={base ? `${base}?board=today` : "/today"} className="text-xs text-muted hover:text-fg">
                  See all →
                </Link>
              </div>
              {todayTop.rows.length ? (
                <ol className="mt-3 grid gap-2">
                  {todayTop.rows.map((r) => (
                    <li key={r.id}>
                      <Link href={`/product/${r.slug}`} className="flex items-center gap-2 text-sm hover:text-brand">
                        <span className="w-6 font-bold text-muted tabular-nums">#{r.rank}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                        <span className="font-bold tabular-nums">${r.spend.toLocaleString("en-US")}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted">Nobody has claimed today yet. $10 takes #1.</p>
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
