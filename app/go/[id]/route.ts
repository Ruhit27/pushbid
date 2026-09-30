import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { Listing, type ListingDoc } from "@/lib/models";

/** Counts a Click, then sends the visitor to the Listing's link. */
export async function GET(_req: Request, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return new Response("Not found", { status: 404 });
  await connectDb();
  const listing = await Listing.findOneAndUpdate({ _id: id, hidden: false }, { $inc: { clicks: 1 } }).lean<ListingDoc>();
  if (!listing) return new Response("Not found", { status: 404 });
  const target = new URL(listing.url);
  target.searchParams.set("utm_source", "pushbid");
  return Response.redirect(target, 302);
}
