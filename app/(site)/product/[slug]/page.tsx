import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardList, ListingIcon } from "@/app/_components/Board";
import { CopyLink } from "@/app/_components/CopyLink";
import { allTimeBoard, dayBoard, listingRanks } from "@/lib/boards";
import { connectDb } from "@/lib/db";
import { compact, timeAgo, usd } from "@/lib/format";
import { Category, Listing, type CategoryDoc, type ListingDoc } from "@/lib/models";
import { amountToTakeRank, utcDay } from "@/lib/rules";

async function load(slug: string) {
  await connectDb();
  const listing = await Listing.findOne({ slug, hidden: false }).lean<ListingDoc>();
  if (!listing) return null;
  const category = await Category.findById(listing.category).lean<CategoryDoc>();
  return { listing, category };
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const data = await load((await params).slug);
  return data ? { title: data.listing.title, description: data.listing.description } : { title: "Not found" };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const data = await load((await params).slug);
  if (!data || data.listing.totalSpend <= 0) notFound();
  const { listing, category } = data;
  const id = listing._id.toString();

  const [ranks, today, related] = await Promise.all([
    listingRanks(listing),
    dayBoard(utcDay(new Date())),
    category ? allTimeBoard({ categoryId: category._id.toString(), perPage: 6 }) : null,
  ]);
  const todayRow = today.rows.find((r) => r.id === id);
  const host = new URL(listing.url).hostname.replace(/^www\./, "");
  const outrankAmount = amountToTakeRank(ranks.category, listing.totalSpend);

  return (
    <div className="grid gap-8">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-fg">
          Leaderboard
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/category/${category.slug}`} className="hover:text-fg">
              {category.name}
            </Link>
          </>
        )}
      </p>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ListingIcon src={listing.iconUrl} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight">{listing.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {category?.name} · {host} · {timeAgo(listing.createdAt)} · {compact(listing.clicks)} clicks
          </p>
          {listing.description && <p className="mt-3 max-w-2xl">{listing.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`/go/${id}`} target="_blank" rel="noopener" className="rounded-xl bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-strong">
              Visit
            </a>
            <CopyLink />
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card label="All-time Spend" value={usd(listing.totalSpend)} />
        <Card
          label="Category rank"
          value={`#${ranks.category}`}
          note={`of ${ranks.categoryCount} in ${category?.shortName ?? ""}`}
          href={category ? `/category/${category.slug}#rank-${listing.slug}` : undefined}
        />
        <Card label="Overall rank" value={`#${ranks.overall}`} note={`of ${compact(ranks.overallCount)} on the board`} href={`/#rank-${listing.slug}`} />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold">About this ranking</h2>
        <ul className="mt-3 grid gap-2 text-muted">
          <li>
            {listing.raises > 0
              ? `Raised ${listing.raises} time${listing.raises === 1 ? "" : "s"}, most recently ${timeAgo(listing.spendSince)}.`
              : `Listed ${timeAgo(listing.createdAt)} and not raised since.`}{" "}
            {compact(listing.clicks)} visitors have opened {host} from Push Bid.
          </li>
          <li>
            {todayRow
              ? `Spent ${usd(todayRow.spend)} today, which puts it at #${todayRow.rank} on today's board.`
              : "No Spend since midnight UTC, so it isn't on today's board."}
          </li>
          <li>
            Anyone can take this rank for <strong className="text-fg">{usd(outrankAmount)}</strong>
            {category ? ` on the ${category.name} board` : ""}.{" "}
            <Link href={`/category/${category?.slug}?amount=${outrankAmount}#claim`} className="font-semibold text-brand hover:underline">
              Claim it
            </Link>
          </li>
        </ul>
      </section>

      {related && related.rows.filter((r) => r.id !== id).length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Also in {category?.name}</h2>
            <Link href={`/category/${category?.slug}`} className="text-sm text-muted hover:text-fg">
              See all →
            </Link>
          </div>
          <div className="mt-3">
            <BoardList rows={related.rows.filter((r) => r.id !== id).slice(0, 5)} />
          </div>
        </section>
      )}
    </div>
  );
}

function Card({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="rounded-2xl border border-line bg-surface p-4 hover:border-brand">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl border border-line bg-surface p-4">{body}</div>
  );
}
