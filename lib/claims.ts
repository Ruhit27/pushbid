import "server-only";
import mongoose, { isValidObjectId, Types } from "mongoose";
import { dayTotalsPipeline, listingsAhead, ON_BOARD, RANK_ORDER } from "./boards";
import { connectDb } from "./db";
import { slugFromKey, type NormalizedLink } from "./link";
import { Category, Checkout, Claim, Listing, type CategoryDoc, type ListingDoc } from "./models";
import { checkClaim, utcDay, type BoardStanding } from "./rules";

export class ClaimError extends Error {}

export type ClaimRequest = {
  link: NormalizedLink;
  /** The All-time Spend the Listing should reach. */
  targetTotal: number;
  /** Only used when the Listing is new. */
  categoryId: string;
};

/**
 * Checks a Claim against the rules before the customer pays, and works out what it charges.
 * Nothing is written: the Spend only lands once the payment does, in `fulfilCheckout`.
 */
export async function prepareClaim(req: ClaimRequest): Promise<{ charge: number; categoryId: Types.ObjectId }> {
  await connectDb();
  const day = utcDay(new Date());
  const existing = await Listing.findOne({ key: req.link.key }).lean<ListingDoc>();
  if (existing?.hidden) throw new ClaimError("This listing has been removed from the board.");

  const category = existing
    ? await Category.findById(existing.category).lean<CategoryDoc>()
    : isValidObjectId(req.categoryId)
      ? await Category.findById(req.categoryId).lean<CategoryDoc>()
      : null;
  if (!category) throw new ClaimError("Choose a category.");

  const [overallAllTime, categoryAllTime, today] = await Promise.all([
    allTimeLeaders(),
    allTimeLeaders(category._id),
    todayTotals(day),
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
  return { charge: check.charge, categoryId: category._id };
}

/**
 * Turns a paid Checkout into a Claim: adds its amount to the Listing's Spend (creating the Listing if it is
 * still new), all in one transaction. Safe to call more than once for the same Checkout. The rules aren't
 * checked again, because the customer has already paid; the Rank is whatever the Spend supports once it lands.
 */
export async function fulfilCheckout(checkoutId: string, paymentId: string): Promise<void> {
  if (!isValidObjectId(checkoutId)) return;
  await connectDb();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const checkout = await Checkout.findOneAndUpdate(
        { _id: checkoutId, status: { $ne: "paid" } },
        { $set: { status: "paid", paymentId } },
        { session, returnDocument: "after", lean: true },
      );
      if (!checkout) return;

      const now = new Date();
      const existing = await Listing.findOne({ key: checkout.key }).session(session).lean<ListingDoc>();
      let listing: ListingDoc;
      if (existing) {
        listing = (await Listing.findByIdAndUpdate(
          existing._id,
          { $inc: { totalSpend: checkout.amount, raises: 1 }, $set: { spendSince: now } },
          { session, returnDocument: "after", lean: true },
        ))!;
      } else {
        const [created] = await Listing.create(
          [
            {
              key: checkout.key,
              slug: slugFromKey(checkout.key),
              url: checkout.url,
              kind: checkout.kind,
              title: checkout.details.title.trim().slice(0, 120) || checkout.key,
              description: checkout.details.description.trim().slice(0, 300),
              iconUrl: checkout.details.iconUrl,
              category: checkout.details.category,
              totalSpend: checkout.amount,
              spendSince: now,
            },
          ],
          { session },
        );
        listing = created.toObject();
      }

      const rank = (await Listing.countDocuments(listingsAhead(listing)).session(session)) + 1;
      await Claim.create(
        [{ listing: listing._id, user: checkout.user, amount: checkout.amount, day: utcDay(now), rankAfter: rank }],
        { session },
      );
      await Checkout.updateOne({ _id: checkout._id }, { $set: { result: { slug: listing.slug, rank } } }, { session });
    });
  } finally {
    await session.endSession();
  }
}

/** Marks a Checkout whose payment failed or was cancelled. A later successful payment still fulfils it. */
export async function failCheckout(checkoutId: string): Promise<void> {
  if (!isValidObjectId(checkoutId)) return;
  await connectDb();
  await Checkout.updateOne({ _id: checkoutId, status: "pending" }, { $set: { status: "failed" } });
}

type Ranked = { _id: Types.ObjectId; spend: number };

/** The top two of an All-time Board: enough to know the leader among the other Listings. */
async function allTimeLeaders(category?: Types.ObjectId): Promise<Ranked[]> {
  const top = await Listing.find({ ...ON_BOARD, ...(category ? { category } : {}) }, { totalSpend: 1 })
    .sort(RANK_ORDER)
    .limit(2)
    .lean<{ _id: Types.ObjectId; totalSpend: number }[]>();
  return top.map((l) => ({ _id: l._id, spend: l.totalSpend }));
}

async function todayTotals(day: string) {
  return Claim.aggregate<Ranked & { category: Types.ObjectId }>(dayTotalsPipeline(day));
}

/** Where a Listing stands on a Board, given that Board's Listings in Rank order. */
function standing(board: string, ranked: Ranked[], listingId?: Types.ObjectId): BoardStanding {
  const index = listingId ? ranked.findIndex((r) => r._id.equals(listingId)) : -1;
  const topOther = ranked.find((_, i) => i !== index);
  return { board, current: index >= 0 ? ranked[index].spend : 0, topOther: topOther?.spend ?? null, leads: index === 0 };
}
