import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/app/_components/Logo";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { adminLogout } from "../actions";

export const dynamic = "force-dynamic";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/listings", "Listings"],
  ["/admin/categories", "Categories"],
  ["/admin/users", "Users"],
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/admin/login");
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-fg px-2 py-0.5 text-xs font-semibold text-bg">admin</span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto text-sm">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-fg">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted hover:text-fg">
              View site ↗
            </Link>
            <ThemeToggle />
            <form action={adminLogout}>
              <button className="rounded-full border border-line px-3 py-1.5 hover:border-fg">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
