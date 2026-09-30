import Link from "next/link";
import { siteStats } from "@/lib/boards";
import { compact, usd } from "@/lib/format";
import { LogoMark } from "./Logo";

export async function Footer() {
  const stats = await siteStats();
  const days = stats.daysLive;
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted">
          Push Bid by the numbers{days ? ` over the last ${days} day${days === 1 ? "" : "s"}` : ""}
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-4 sm:max-w-xl">
          <Stat label="listings" value={compact(stats.listings)} />
          <Stat label="spent" value={usd(stats.totalSpend)} />
          <Stat label="added today" value={compact(stats.addedToday)} />
        </dl>
        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-2 font-semibold text-fg">
            <LogoMark size={20} /> Push Bid
          </span>
          {[
            ["/rules", "Rules"],
            ["/faq", "FAQ"],
            ["/terms", "Terms"],
            ["/privacy", "Privacy"],
            ["/about", "About"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-fg">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-2xl font-extrabold tabular-nums tracking-tight">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}
