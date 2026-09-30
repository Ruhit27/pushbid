import "server-only";
import mongoose, { isValidObjectId, Types } from "mongoose";
import { dayTotalsPipeline, listingsAhead, ON_BOARD, RANK_ORDER } from "./boards";
import { connectDb } from "./db";
import { usd } from "./format";
import { slugFromKey, type NormalizedLink } from "./link";
import { Category, Claim, Listing, User, type CategoryDoc, type ListingDoc } from "./models";
import { checkClaim, utcDay, type BoardStanding } from "./rules";

export class ClaimError extends Error {}

export type ClaimRequest = {
  userId: string;
  link: NormalizedLink;
  /** The All-time Spend the Listing should reach. */
  targetTotal: number;
  /** Only used when the Listing is new. */
  details: { title: string; description: string; iconUrl: string; categoryId: string };
};

export type ClaimResult = { slug: string; charge: number; rank: number; totalSpend: number };

/**
 * Makes a Claim: checks the rules, takes the Credits, and adds the Spend to the Listing
 * (creating it if new), all in one transaction. The Rank is whatever the Spend supports once it lands.
 */
export async function makeClaim(req: ClaimRequest): Promise<ClaimResult> {
  await connectDb();
  const session = await mongoose.startSession();
  try {
    let result!: ClaimResult;
    await session.withTransaction(async () => {
      const now = new Date();
      const day = utcDay(now);
      const existing = await Listing.findOne({ key: req.link.key }).session(session).lean<ListingDoc>();
      if (existing?.hidden) throw new ClaimError("This listing has been removed from the board.");

      const category = existing
        ? await Category.findById(existing.category).session(session).lean<CategoryDoc>()
        : isValidObjectId(req.details.categoryId)
          ? await Category.findById(req.details.categoryId).session(session).lean<CategoryDoc>()
          : null;
      if (!category) throw new ClaimError("Choose a category.");

      const [overallAllTime, categoryAllTime, today] = await Promise.all([
        allTimeLeaders(session),
        allTimeLeaders(session, category._id),
        todayTotals(day, session),
      ]);
      const categoryToday = today.filter((t) => t.category.equals(category._id));

      const check = checkClaim({
        currentTotal: existing ? existing.totalSpend : null,
        targetTotal: req.targetTotal,
        boards: [
          standing("All-time", overallAllTime, existing?._id),
          standing(category.name, categoryAllTime, existing?._id),
          standing("Today", today, existing?._id),
          standing(`today's ${category.name}`, categoryToday, existing?._id),
        ],
      });
      if (!check.ok) throw new ClaimError(check.error);

      const paid = await User.findOneAndUpdate(
        { _id: new Types.ObjectId(req.userId), credits: { $gte: check.charge } },
        { $inc: { credits: -check.charge } },
        { session, returnDocument: "after" },
      );
      if (!paid) throw new ClaimError(`You need ${usd(check.charge)} in Credits for this Claim.`);

      let listing: ListingDoc;
      if (existing) {
        listing = (await Listing.findByIdAndUpdate(
          existing._id,
          { $inc: { totalSpend: check.charge, raises: 1 }, $set: { spendSince: now } },
          { session, returnDocument: "after", lean: true },
        ))!;
      } else {
        const [created] = await Listing.create(
          [
            {
              key: req.link.key,
              slug: slugFromKey(req.link.key),
              url: req.link.url,
              kind: req.link.kind,
              title: req.details.title.trim().slice(0, 120) || req.link.key,
              description: req.details.description.trim().slice(0, 300),
              iconUrl: req.details.iconUrl,
              category: category._id,
              totalSpend: check.charge,
              spendSince: now,
            },
          ],
          { session },
        );
        listing = created.toObject();
      }

      const ahead = await Listing.countDocuments(listingsAhead(listing)).session(session);

      await Claim.create(
        [{ listing: listing._id, user: paid._id, amount: check.charge, day, rankAfter: ahead + 1 }],
        { session },
      );
      result = { slug: listing.slug, charge: check.charge, rank: ahead + 1, totalSpend: listing.totalSpend };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

type Ranked = { _id: Types.ObjectId; spend: number };

/** The top two of an All-time Board: enough to know the leader among the other Listings. */
async function allTimeLeaders(session: mongoose.ClientSession, category?: Types.ObjectId): Promise<Ranked[]> {
  const top = await Listing.find({ ...ON_BOARD, ...(category ? { category } : {}) }, { totalSpend: 1 })
    .sort(RANK_ORDER)
    .limit(2)
    .session(session)
    .lean<{ _id: Types.ObjectId; totalSpend: number }[]>();
  return top.map((l) => ({ _id: l._id, spend: l.totalSpend }));
}

async function todayTotals(day: string, session: mongoose.ClientSession) {
  return Claim.aggregate<Ranked & { category: Types.ObjectId }>(dayTotalsPipeline(day)).session(session);
}

/** Where a Listing stands on a Board, given that Board's Listings in Rank order. */
function standing(board: string, ranked: Ranked[], listingId?: Types.ObjectId): BoardStanding {
  const index = listingId ? ranked.findIndex((r) => r._id.equals(listingId)) : -1;
  const topOther = ranked.find((_, i) => i !== index);
  return { board, current: index >= 0 ? ranked[index].spend : 0, topOther: topOther?.spend ?? null, leads: index === 0 };
}
