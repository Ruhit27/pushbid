import Link from "next/link";
import { signInWithGoogle } from "@/app/actions";
import { siteStats } from "@/lib/boards";
import { compact, usd } from "@/lib/format";
import { getViewer } from "@/lib/viewer";
import { Logo } from "./Logo";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/daily", label: "Daily" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
];

export async function Header() {
  const [viewer, stats] = await Promise.all([getViewer(), siteStats()]);
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-5">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Push Bid home" className="shrink-0">
          <Logo />
        </Link>
        <Link
          href="/about"
          className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-fg md:flex"
        >
          <span className="h-2 w-2 rounded-full bg-ok" />
          <span className="font-semibold text-ok">{compact(stats.listings)} listings</span>
          <span>· {usd(stats.todaySpend)} spent today ·</span>
          <span className="font-medium text-fg">stats →</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 font-medium text-muted transition hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
          <SearchDialog />
          {viewer ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 text-sm transition hover:border-brand"
              title="Your account"
            >
              {viewer.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewer.image} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="h-7 w-7 rounded-full bg-brand" />
              )}
              <span className="font-semibold">Account</span>
            </Link>
          ) : (
            <form action={signInWithGoogle}>
              <button className="rounded-full px-3 py-2 text-sm font-semibold text-fg transition hover:bg-surface-2">Sign in</button>
            </form>
          )}
          <ThemeToggle />
        </div>
      </div>
      <Link href="/about" className="mt-3 flex w-fit items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted md:hidden">
        <span className="h-2 w-2 rounded-full bg-ok" />
        <span className="font-semibold text-ok">{compact(stats.listings)} listings</span>
        <span>· {usd(stats.todaySpend)} spent today · stats →</span>
      </Link>
      <nav className="no-scrollbar mt-2 flex gap-1 overflow-x-auto lg:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:text-fg">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
