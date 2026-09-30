import { ON_BOARD, RANK_ORDER } from "@/lib/boards";
import { connectDb } from "@/lib/db";
import { Listing, type ListingDoc } from "@/lib/models";

export type SearchHit = { slug: string; title: string; link: string; iconUrl: string; spend: number };

/** Listings on the board whose title or link contains `q`, highest Spend first. */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json([]);
  await connectDb();
  const pattern = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const found = await Listing.find({ ...ON_BOARD, $or: [{ title: pattern }, { key: pattern }] })
    .sort(RANK_ORDER)
    .limit(8)
    .lean<ListingDoc[]>();
  const hits: SearchHit[] = found.map((l) => ({ slug: l.slug, title: l.title, link: l.key, iconUrl: l.iconUrl ?? "", spend: l.totalSpend }));
  return Response.json(hits);
}
