import type { Metadata } from "next";
import Link from "next/link";
import { siteStats } from "@/lib/boards";
import { usd } from "@/lib/format";
import { CountUp } from "@/app/_components/CountUp";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const stats = await siteStats();
  return (
    <article className="prose-page mx-auto max-w-2xl">
      <h1>About Push Bid</h1>
      <p>
        Push Bid asks one question: how much is the top spot worth to you? Every product sits on a public board, and the only way up is
        to spend more than the one above you. There are no upvotes to farm, no launch-day lottery, and no reviewers to win over.
      </p>
      <div className="not-prose my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          [stats.listings, "", "listings"],
          [stats.totalSpend, "$", "spent"],
          [stats.addedToday, "", "added today"],
          [stats.todaySpend, "$", "spent today"],
        ] as const).map(([v, prefix, l]) => (
          <div key={l} className="rounded-3xl border border-line bg-surface p-4">
            <p className="text-2xl font-semibold tabular-nums">
              <CountUp value={v} prefix={prefix} />
            </p>
            <p className="text-xs text-muted">{l}</p>
          </div>
        ))}
      </div>
      {stats.top && (
        <p>
          The listing at the top right now is <strong>{stats.top.title}</strong> with {usd(stats.top.spend)}.{" "}
          <Link href="/#claim">Think you can beat it?</Link>
        </p>
      )}
      <h2>How it works</h2>
      <p>
        Sign in, paste your link, choose an amount and claim. The <Link href="/rules">rules</Link> explain the rest.
      </p>
    </article>
  );
}
