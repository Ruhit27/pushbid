import "server-only";
import { Types, type PipelineStage } from "mongoose";
import { connectDb } from "./db";
import { Category, Claim, Listing, type CategoryDoc, type ListingDoc } from "./models";
import { amountToTakeFirst, utcDay, utcDayStart } from "./rules";

export const PAGE_SIZE = 50;

export type CategoryInfo = { id: string; slug: string; name: string; shortName: string };

export type BoardRow = {
  id: string;
  slug: string;
  url: string;
  title: string;
  description: string;
  iconUrl: string;
  host: string;
  category: CategoryInfo | null;
  spend: number;
  clicks: number;
  createdAt: Date;
  rank: number;
};

/** Listings that appear on the All-time Boards. */
export const ON_BOARD = { hidden: false, totalSpend: { $gt: 0 } };

/** Higher Spend first; on equal Spend, whoever reached it first. Mirrors `compareStanding`. */
export const RANK_ORDER = { totalSpend: -1, spendSince: 1, _id: 1 } as const;

/** Every All-time Listing ranked above `l` (the same order as RANK_ORDER). */
export function listingsAhead(l: Pick<ListingDoc, "_id" | "totalSpend" | "spendSince">) {
  return {
    ...ON_BOARD,
    $or: [
      { totalSpend: { $gt: l.totalSpend } },
      { totalSpend: l.totalSpend, spendSince: { $lt: l.spendSince } },
      { totalSpend: l.totalSpend, spendSince: l.spendSince, _id: { $lt: l._id } },
    ],
  };
}

/** Spend per visible Listing on one UTC day, in Rank order, optionally for one Category. */
export function dayTotalsPipeline(day: string, categoryId?: string): PipelineStage[] {
  return [
    { $match: { day } },
    { $group: { _id: "$listing", spend: { $sum: "$amount" }, since: { $max: "$createdAt" } } },
    { $lookup: { from: "listings", localField: "_id", foreignField: "_id", as: "listing" } },
    { $unwind: "$listing" },
    { $match: { "listing.hidden": false, ...(categoryId ? { "listing.category": new Types.ObjectId(categoryId) } : {}) } },
    { $addFields: { category: "$listing.category" } },
    { $sort: { spend: -1, since: 1, _id: 1 } },
  ];
}

export async function getCategories(): Promise<CategoryInfo[]> {
  await connectDb();
  const cats = await Category.find().sort({ order: 1, name: 1 }).lean<CategoryDoc[]>();
  return cats.map(toCategoryInfo);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  await connectDb();
  const cat = await Category.findOne({ slug }).lean<CategoryDoc>();
  return cat ? toCategoryInfo(cat) : null;
}

function toCategoryInfo(c: CategoryDoc): CategoryInfo {
  return { id: c._id.toString(), slug: c.slug, name: c.name, shortName: c.shortName };
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function categoryMap() {
  const cats = await getCategories();
  return new Map(cats.map((c) => [c.id, c]));
}

function toRow(l: ListingDoc, cats: Map<string, CategoryInfo>, spend: number, rank: number): BoardRow {
  return {
    id: l._id.toString(),
    slug: l.slug,
    url: l.url,
    title: l.title,
    description: l.description ?? "",
    iconUrl: l.iconUrl ?? "",
    host: hostOf(l.url),
    category: cats.get(l.category.toString()) ?? null,
    spend,
    clicks: l.clicks ?? 0,
    createdAt: l.createdAt,
    rank,
  };
}

/** The All-time Board, overall or for one Category. */
export async function allTimeBoard(opts: { categoryId?: string; page?: number; perPage?: number } = {}) {
  await connectDb();
  const perPage = opts.perPage ?? PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const filter = { ...ON_BOARD, ...(opts.categoryId ? { category: new Types.ObjectId(opts.categoryId) } : {}) };
  const [listings, total, cats] = await Promise.all([
    Listing.find(filter)
      .sort(RANK_ORDER)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean<ListingDoc[]>(),
    Listing.countDocuments(filter),
    categoryMap(),
  ]);
  const rows = listings.map((l, i) => toRow(l, cats, l.totalSpend, (page - 1) * perPage + i + 1));
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** The Today Board or a Daily Board: the same thing, for a given UTC day. */
export async function dayBoard(day: string, opts: { categoryId?: string; limit?: number } = {}) {
  await connectDb();
  const [totals, cats] = await Promise.all([
    Claim.aggregate<{ spend: number; listing: ListingDoc }>(dayTotalsPipeline(day, opts.categoryId)),
    categoryMap(),
  ]);
  const limited = opts.limit ? totals.slice(0, opts.limit) : totals;
  return { rows: limited.map((t, i) => toRow(t.listing, cats, t.spend, i + 1)), total: totals.length };
}

export type BoardKind = "all-time" | "today";

/** What a Listing's Spend must reach to take #1 on the given Board. */
export async function amountForFirst(board: BoardKind, categoryId?: string) {
  const { rows } =
    board === "today"
      ? await dayBoard(utcDay(new Date()), { categoryId, limit: 1 })
      : await allTimeBoard({ categoryId, perPage: 1 });
  return amountToTakeFirst(rows[0]?.spend ?? null);
}

/** The Listing's All-time Rank overall and within its Category. */
export async function listingRanks(l: Pick<ListingDoc, "_id" | "totalSpend" | "spendSince" | "category">) {
  await connectDb();
  const ahead = listingsAhead(l);
  const [overallAhead, overallCount, categoryAhead, categoryCount] = await Promise.all([
    Listing.countDocuments(ahead),
    Listing.countDocuments(ON_BOARD),
    Listing.countDocuments({ ...ahead, category: l.category }),
    Listing.countDocuments({ ...ON_BOARD, category: l.category }),
  ]);
  return { overall: overallAhead + 1, overallCount, category: categoryAhead + 1, categoryCount };
}

export type ActivityItem = {
  id: string;
  amount: number;
  rankAfter: number;
  createdAt: Date;
  listing: { slug: string; title: string; iconUrl: string };
};

export async function latestActivity(limit = 5): Promise<ActivityItem[]> {
  await connectDb();
  const claims = await Claim.aggregate([
    { $sort: { createdAt: -1 } },
    { $lookup: { from: "listings", localField: "listing", foreignField: "_id", as: "listing" } },
    { $unwind: "$listing" },
    { $match: { "listing.hidden": false } },
    { $limit: limit },
  ]);
  return claims.map((c) => ({
    id: c._id.toString(),
    amount: c.amount,
    rankAfter: c.rankAfter,
    createdAt: c.createdAt,
    listing: { slug: c.listing.slug, title: c.listing.title, iconUrl: c.listing.iconUrl ?? "" },
  }));
}

export async function siteStats() {
  await connectDb();
  const today = utcDay(new Date());
  const [listings, spend, todaySpend, addedToday, top] = await Promise.all([
    Listing.countDocuments(ON_BOARD),
    Claim.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Claim.aggregate<{ total: number }>([{ $match: { day: today } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Listing.countDocuments({ ...ON_BOARD, createdAt: { $gte: utcDayStart(today) } }),
    Listing.findOne(ON_BOARD).sort(RANK_ORDER).lean<ListingDoc>(),
  ]);
  const first = await Claim.findOne().sort({ createdAt: 1 }).lean();
  return {
    listings,
    totalSpend: spend[0]?.total ?? 0,
    todaySpend: todaySpend[0]?.total ?? 0,
    addedToday,
    since: first?.createdAt ?? null,
    daysLive: first ? Math.max(1, Math.ceil((Date.now() - first.createdAt.getTime()) / 86_400_000)) : 0,
    top: top ? { title: top.title, spend: top.totalSpend } : null,
  };
}

/** Categories ordered by how many Claims they've had in the last 7 days, each with its current leaders. */
export async function categoryOverview() {
  await connectDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [cats, activity] = await Promise.all([
    getCategories(),
    Claim.aggregate<{ _id: Types.ObjectId; claims: number; last: Date }>([
      { $match: { createdAt: { $gte: since } } },
      { $lookup: { from: "listings", localField: "listing", foreignField: "_id", as: "l" } },
      { $unwind: "$l" },
      { $match: { "l.hidden": false } },
      { $group: { _id: "$l.category", claims: { $sum: 1 }, last: { $max: "$createdAt" } } },
    ]),
  ]);
  const byCat = new Map(activity.map((a) => [a._id.toString(), a]));
  const withLeaders = await Promise.all(
    cats.map(async (c) => {
      const board = await allTimeBoard({ categoryId: c.id, perPage: 3 });
      const a = byCat.get(c.id);
      return { ...c, leaders: board.rows, count: board.total, claims: a?.claims ?? 0, lastClaim: a?.last ?? null };
    }),
  );
  return withLeaders.sort(
    (a, b) => b.claims - a.claims || (b.lastClaim?.getTime() ?? 0) - (a.lastClaim?.getTime() ?? 0) || b.count - a.count,
  );
}

/** Every UTC day with Claims, newest first, from the first Claim up to today. */
export async function dailyArchive(opts: { categoryId?: string; limit?: number } = {}) {
  await connectDb();
  const days = (await Claim.distinct("day")) as string[];
  const today = utcDay(new Date());
  const all = Array.from(new Set([today, ...days])).sort().reverse().slice(0, opts.limit ?? 60);
  return Promise.all(all.map(async (day) => ({ day, ...(await dayBoard(day, { categoryId: opts.categoryId, limit: 3 })) })));
}
