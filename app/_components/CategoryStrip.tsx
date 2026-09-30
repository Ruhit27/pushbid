import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import type { CategoryInfo } from "@/lib/boards";
import { CategoryIcon } from "./CategoryIcon";

/** The rounded bar of Category chips under the header. `hrefFor` lets other pages reuse it as a filter. */
export function CategoryStrip({
  categories,
  active,
  allHref = "/",
  hrefFor = (c) => `/category/${c.slug}`,
  explore = true,
}: {
  categories: CategoryInfo[];
  active?: string;
  allHref?: string;
  hrefFor?: (c: CategoryInfo) => string;
  explore?: boolean;
}) {
  const chip = (on: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      on ? "bg-brand text-white shadow-sm" : "text-fg hover:bg-surface"
    }`;
  return (
    <div className="relative rounded-full bg-surface-2 p-1.5">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pr-28 [mask-image:linear-gradient(to_right,black_85%,transparent)]">
        <Link href={allHref} className={chip(!active)}>
          <LayoutGrid size={15} strokeWidth={1.75} aria-hidden="true" /> All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={hrefFor(c)} className={chip(active === c.slug)} title={c.name}>
            <CategoryIcon icon={c.icon} size={15} className={active === c.slug ? "" : "text-brand"} /> {c.shortName}
          </Link>
        ))}
      </div>
      {explore && (
        <Link
          href="/categories"
          className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 py-1.5 text-sm font-semibold text-brand hover:bg-surface"
        >
          <LayoutGrid size={15} strokeWidth={1.75} aria-hidden="true" /> Explore
        </Link>
      )}
    </div>
  );
}
