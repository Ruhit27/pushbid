import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { ListingIcon } from "@/app/_components/Board";
import { connectDb } from "@/lib/db";
import { timeAgo, usd } from "@/lib/format";
import { Claim } from "@/lib/models";
import { getViewer } from "@/lib/viewer";
import { Types } from "mongoose";

export const metadata: Metadata = { title: "My account" };

type ClaimRow = { _id: Types.ObjectId; amount: number; rankAfter: number; createdAt: Date; listing: { slug: string; title: string; iconUrl: string; totalSpend: number; hidden: boolean } };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/account");
  await connectDb();
  const user = new Types.ObjectId(viewer.id);
  const [claims, perListing] = await Promise.all([
    Claim.aggregate<ClaimRow>([
      { $match: { user } },
      { $sort: { createdAt: -1 } },
      { $limit: 200 },
      { $lookup: { from: "listings", localField: "listing", foreignField: "_id", as: "listing" } },
      { $unwind: "$listing" },
    ]),
    Claim.aggregate<{ listing: ClaimRow["listing"]; mine: number; last: Date }>([
      { $match: { user } },
      { $group: { _id: "$listing", mine: { $sum: "$amount" }, last: { $max: "$createdAt" } } },
      { $sort: { last: -1 } },
      { $lookup: { from: "listings", localField: "_id", foreignField: "_id", as: "listing" } },
      { $unwind: "$listing" },
    ]),
  ]);
  const spent = perListing.reduce((s, l) => s + l.mine, 0);
  const byListing = new Map(perListing.map((l) => [l.listing.slug, l]));

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center gap-4">
        {viewer.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewer.image} alt="" className="h-14 w-14 rounded-full" referrerPolicy="no-referrer" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{viewer.name || "My account"}</h1>
          <p className="text-sm text-muted">{viewer.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-fg">Sign out</button>
        </form>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand/50 bg-brand-soft p-5">
          <p className="text-sm text-muted">Credits balance</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-brand">{usd(viewer.credits)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Spent on Claims</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">{usd(spent)}</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Listings you&apos;ve spent on</h2>
        {byListing.size ? (
          <ul className="mt-3 grid gap-2">
            {[...byListing.values()].map(({ listing, mine }) => (
              <li key={listing.slug}>
                <Link href={listing.hidden ? "#" : `/product/${listing.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-brand">
                  <ListingIcon src={listing.iconUrl} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{listing.title}</span>
                    <span className="text-xs text-muted">
                      {listing.hidden ? "Removed from the board" : `All-time Spend ${usd(listing.totalSpend)}`}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">you: {usd(mine)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">
            Nothing yet. <Link href="/#claim" className="font-semibold text-brand hover:underline">Make your first Claim</Link>.
          </p>
        )}
      </section>

      {claims.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Claim history</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2">Listing</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Rank after</th>
                  <th className="px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c._id.toString()} className="border-t border-line">
                    <td className="px-4 py-2">{c.listing.title}</td>
                    <td className="px-4 py-2 font-semibold tabular-nums">{usd(c.amount)}</td>
                    <td className="px-4 py-2 tabular-nums">#{c.rankAfter}</td>
                    <td className="px-4 py-2 text-muted">{timeAgo(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
