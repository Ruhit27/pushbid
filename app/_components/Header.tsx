import Link from "next/link";
import { signInWithGoogle } from "@/app/actions";
import { usd } from "@/lib/format";
import { getViewer } from "@/lib/viewer";
import { Logo } from "./Logo";

const nav = [
  { href: "/daily", label: "Daily" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
];

export async function Header() {
  const viewer = await getViewer();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="Push Bid home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewer ? (
            <Link href="/account" className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 text-sm hover:border-brand">
              {viewer.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewer.image} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-brand" />
              )}
              <span className="font-semibold tabular-nums">{usd(viewer.credits)}</span>
              <span className="hidden text-muted sm:inline">credits</span>
            </Link>
          ) : (
            <form action={signInWithGoogle}>
              <button className="rounded-full bg-fg px-3.5 py-1.5 text-sm font-semibold text-bg hover:opacity-90">Sign in</button>
            </form>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 text-sm sm:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="rounded-md px-2 py-1 text-muted">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
