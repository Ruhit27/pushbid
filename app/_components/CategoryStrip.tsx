import Link from "next/link";
import type { CategoryInfo } from "@/lib/boards";

export function CategoryStrip({ categories, active }: { categories: CategoryInfo[]; active?: string }) {
  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-sm transition ${
      on ? "border-brand bg-brand text-white" : "border-line bg-surface text-muted hover:border-fg hover:text-fg"
    }`;
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      <Link href="/" className={chip(!active)}>
        All
      </Link>
      {categories.map((c) => (
        <Link key={c.id} href={`/category/${c.slug}`} className={chip(active === c.slug)} title={c.name}>
          {c.shortName}
        </Link>
      ))}
      <Link href="/categories" className={chip(false)}>
        Explore →
      </Link>
    </div>
  );
}
