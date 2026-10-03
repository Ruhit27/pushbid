import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FAQ" };

const faqs: [string, React.ReactNode][] = [
  ["What is Push Bid?", "A public leaderboard where products are ranked only by how much has been spent on them. There's no voting and no editorial picks."],
  [
    "How do I get listed?",
    <>Sign in with Google, paste your product link or X @handle into the Claim box, choose a category, pick an amount, and pay through Dodo Payments. New listings start at $10.</>,
  ],
  ["How do I pay?", "Each Claim is a one-time payment through Dodo Payments' secure checkout. There's no balance to top up and no subscription. Your listing goes live as soon as the payment is confirmed."],
  ["How do I get #1?", "Spend at least $5 more than the current #1 on that board. On Today, that's $5 more than the most anyone else has spent since midnight UTC."],
  ["Can I raise my listing later?", "Yes. Enter the same link again and choose a higher total. It has to be at least $1 more, and you only pay the difference."],
  [
    "What's the difference between All-time, Today and Daily?",
    <>
      <Link href="/">All-time</Link> counts everything ever spent. <Link href="/today">Today</Link> counts only since midnight UTC.{" "}
      <Link href="/daily">Daily</Link> keeps one frozen board per day.
    </>,
  ],
  ["What if someone claims while I'm checking out?", "Your rank is worked out when your Claim goes through, so you land wherever your amount places you at that moment."],
  ["Are Claims refundable?", "No. Claims are final, even if you're outranked later or your listing is removed for breaking the rules."],
  ["What can't I list?", <>Chat or invite links, adult content, and link shorteners. See the <Link href="/rules">rules</Link>.</>],
  ["How do categories work?", "Every listing belongs to one category, and each category has its own All-time and Today boards. You pick the category when you first list. After that, only an admin can change it."],
];

export default function FaqPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl">
      <h1>FAQ</h1>
      {faqs.map(([q, a]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
    </article>
  );
}
