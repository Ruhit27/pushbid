import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BoardList } from "@/app/_components/Board";
import { dayBoard, getCategories, getCategoryBySlug } from "@/lib/boards";
import { formatDay } from "@/lib/format";
import { isUtcDay, utcDay } from "@/lib/rules";
import { CategoryStrip } from "@/app/_components/CategoryStrip";

export async function generateMetadata({ params }: PageProps<"/daily/[day]">): Promise<Metadata> {
  const { day } = await params;
  return { title: isUtcDay(day) ? formatDay(day) : "Daily" };
}

export default async function DayPage({ params, searchParams }: PageProps<"/daily/[day]">) {
  const [{ day }, { category: slug }] = await Promise.all([params, searchParams]);
  if (!isUtcDay(day) || day > utcDay(new Date())) notFound();
  const category = typeof slug === "string" ? await getCategoryBySlug(slug) : null;
  if (day === utcDay(new Date())) redirect(category ? `/category/${category.slug}?board=today` : "/today");
  const [board, categories] = await Promise.all([dayBoard(day, { categoryId: category?.id }), getCategories()]);
  return (
    <div className="grid grid-cols-1 gap-6">
      <header>
        <Link href={category ? `/daily?category=${category.slug}` : "/daily"} className="text-sm text-muted hover:text-fg">
          ← Daily
        </Link>
        <h1 className="mt-1 text-5xl font-semibold tracking-tight">
          {formatDay(day)}
          {category ? ` · ${category.name}` : ""}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {board.total} listing{board.total === 1 ? "" : "s"}, ranked by Spend on this UTC day. This Board is closed.
        </p>
      </header>
      <CategoryStrip categories={categories} active={category?.slug} allHref={`/daily/${day}`} hrefFor={(c) => `/daily/${day}?category=${c.slug}`} explore={false} />
      <BoardList rows={board.rows} empty="Nobody made a Claim this day." />
    </div>
  );
}
