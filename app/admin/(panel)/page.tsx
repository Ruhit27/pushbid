import Link from "next/link";
import { siteStats } from "@/lib/boards";
import { connectDb } from "@/lib/db";
import { compact, usd } from "@/lib/format";
import { Listing, User } from "@/lib/models";
import { ConfirmButton } from "./ConfirmButton";
import { deleteDemoData } from "../actions";

export default async function AdminDashboard() {
  await connectDb();
  const [stats, users, demo, hidden] = await Promise.all([
    siteStats(),
    User.countDocuments(),
    Listing.countDocuments({ demo: true }),
    Listing.countDocuments({ hidden: true }),
  ]);
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Link href="/admin/listings/new" className="rounded-full bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong">
          + Add listing
        </Link>
      </div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Listings on the board", compact(stats.listings)],
          ["Hidden listings", compact(hidden)],
          ["Users", compact(users)],
          ["Total Spend (Claims)", usd(stats.totalSpend)],
          ["Spend today", usd(stats.todaySpend)],
          ["Added today", compact(stats.addedToday)],
          ["Demo listings", compact(demo)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Demo data</h2>
        <p className="mt-1 text-sm text-muted">
          {demo
            ? `${demo} demo listing${demo === 1 ? " is" : "s are"} on the board. Delete them, and their Claims, before you launch.`
            : "There's no demo data left."}
        </p>
        {demo > 0 && (
          <form action={deleteDemoData} className="mt-3">
            <ConfirmButton message={`Delete all ${demo} demo listings and their Claims? This can't be undone.`}>
              Delete all demo data
            </ConfirmButton>
          </form>
        )}
      </section>
    </div>
  );
}
