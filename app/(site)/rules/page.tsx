import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl">
      <h1>Rules</h1>
      <p>
        Push Bid is a public leaderboard of products. Your position comes from one thing only: how much has been spent on your
        listing. No votes, no reviews, no algorithm.
      </p>

      <h2>Three boards, one Claim</h2>
      <ul>
        <li>
          <strong><Link href="/">All-time</Link></strong> adds up every Claim ever made on a listing. It never resets.
        </li>
        <li>
          <strong><Link href="/today">Today</Link></strong> only counts Claims made since midnight UTC and starts over at the next midnight.
        </li>
        <li>
          <strong><Link href="/daily">Daily</Link></strong> keeps a board for every UTC day. Past days are frozen as an archive.
        </li>
      </ul>
      <p>A single Claim counts toward every board whose time window it falls in.</p>

      <h2>What a rank costs</h2>
      <ul>
        <li>Amounts are whole dollars in Credits. A new listing starts at <strong>$10</strong>, and no listing can go above <strong>$999,999</strong>.</li>
        <li>To take <strong>#1</strong> you need at least <strong>$5 more</strong> than the listing currently at #1. Smaller amounts still land on the board, just lower down.</li>
        <li>To take <strong>today&apos;s #1</strong> you need at least $5 more than the most any other listing has spent since midnight UTC.</li>
        <li>If two listings have spent the same amount, whichever reached that amount first stays ahead.</li>
        <li>
          To <strong>raise</strong> a listing that&apos;s already on the board, enter the same link again and pick a new total at least $1
          higher. You only pay the difference.
        </li>
        <li>Anyone can raise any listing. A listing is its link, not its owner.</li>
      </ul>

      <h2>What can be listed</h2>
      <ul>
        <li>A product website, or an X @handle.</li>
        <li>No chat or invite links (Telegram, WhatsApp, Discord, Messenger, Signal, and similar).</li>
        <li>No adult or sexual content.</li>
        <li>Query strings are removed, so referral and tracking links won&apos;t work. Link shorteners are replaced by where they lead.</li>
        <li>App Store, Play Store, GitHub and similar links are identified by their full path, so two different apps never share a listing.</li>
      </ul>

      <h2>After you claim</h2>
      <ul>
        <li>Your listing is public right away, and Clicks go to the link you submitted.</li>
        <li>Claims are final. Being outranked, the Today board resetting, or removal for breaking these rules doesn&apos;t give Credits back.</li>
        <li>An admin can recategorize, edit or remove any listing.</li>
      </ul>
    </article>
  );
}
