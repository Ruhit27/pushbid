import type { Metadata } from "next";
import Link from "next/link";
import { BoardList } from "@/app/_components/Board";
import { Countdown } from "@/app/_components/Countdown";
import { dailyArchive, getCategories, getCategoryBySlug } from "@/lib/boards";
import { CategoryStrip } from "@/app/_components/CategoryStrip";
import { formatDay } from "@/lib/format";
import { utcDay } from "@/lib/rules";

export const metadata: Metadata = { title: "Daily" };

export default async function DailyPage({ searchParams }: PageProps<"/daily">) {
  const { category: slug } = await searchParams;
  const [categories, category] = await Promise.all([getCategories(), typeof slug === "string" ? getCategoryBySlug(slug) : null]);
  const days = await dailyArchive({ categoryId: category?.id });
  const today = utcDay(new Date());
  const suffix = category ? `?category=${category.slug}` : "";
  const todayHref = category ? `/category/${category.slug}?board=today` : "/today";
  return (
    <div className="grid grid-cols-1 gap-6">
      <header>
        <h1 className="text-5xl font-semibold tracking-tight">Daily{category ? ` · ${category.name}` : ""}</h1>
        <p className="mt-3 text-lg text-muted">
          Every UTC day gets its own Board, ranked by what was spent that day. Today stays live until midnight UTC, and after that the day is frozen.
        </p>
      </header>
      <CategoryStrip categories={categories} active={category?.slug} allHref="/daily" hrefFor={(c) => `/daily?category=${c.slug}`} explore={false} />
      <ol className="grid gap-12">
        {days.map((d) => (
          <li key={d.day} className="grid gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold">
                {formatDay(d.day)}{" "}
                {d.day === today && <span className="ml-1 rounded-full bg-brand px-2 py-0.5 align-middle text-xs font-semibold text-white">Live</span>}
              </h2>
              <span className="text-sm text-muted">
                {d.day === today ? (
                  <>
                    <Countdown /> left
                  </>
                ) : (
                  `${d.total} listing${d.total === 1 ? "" : "s"}`
                )}
              </span>
            </div>
            <BoardList rows={d.rows} empty="Nobody made a Claim this day." />
            <div className="flex gap-3 text-sm">
              {d.day === today && (
                <Link href={`${todayHref}#claim`} className="font-semibold text-brand hover:underline">
                  Claim a rank
                </Link>
              )}
              <Link href={d.day === today ? todayHref : `/daily/${d.day}${suffix}`} className="text-muted hover:text-fg">
                Show all ranks →
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
