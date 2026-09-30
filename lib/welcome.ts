import "server-only";
import { Types } from "mongoose";
import { listingsAhead, ON_BOARD, RANK_ORDER } from "./boards";
import { connectDb } from "./db";
import { Claim, Listing, type ListingDoc } from "./models";

export type WelcomeListing = { slug: string; title: string; iconUrl: string; rank: number; rankBefore: number };

/**
 * The user's best-ranked Listings (up to `limit`) among those they've made a Claim on, each with its
 * All-time Rank now and right after the user's last Claim on it.
 */
export async function yourListings(userId: string, limit = 3): Promise<WelcomeListing[]> {
  await connectDb();
  const lastClaims = await Claim.aggregate<{ _id: Types.ObjectId; rankAfter: number }>([
    { $match: { user: new Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$listing", rankAfter: { $first: "$rankAfter" } } },
  ]);
  if (!lastClaims.length) return [];
  const before = new Map(lastClaims.map((c) => [c._id.toString(), c.rankAfter]));
  const listings = await Listing.find({ ...ON_BOARD, _id: { $in: lastClaims.map((c) => c._id) } })
    .sort(RANK_ORDER)
    .limit(limit)
    .lean<ListingDoc[]>();
  return Promise.all(
    listings.map(async (l) => ({
      slug: l.slug,
      title: l.title,
      iconUrl: l.iconUrl,
      rank: (await Listing.countDocuments(listingsAhead(l))) + 1,
      rankBefore: before.get(l._id.toString())!,
    })),
  );
}

