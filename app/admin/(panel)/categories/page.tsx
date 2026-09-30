import { connectDb } from "@/lib/db";
import { Category, Listing, type CategoryDoc } from "@/lib/models";
import { CategoryRow, NewCategory } from "./CategoryForms";

export default async function AdminCategories() {
  await connectDb();
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean<CategoryDoc[]>(),
    Listing.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const countOf = new Map(counts.map((c) => [String(c._id), c.n]));
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
      <NewCategory />
      <div className="grid gap-2">
        <div className="hidden grid-cols-[1fr_140px_1fr_70px_60px_auto] gap-2 px-3 text-xs text-muted md:grid">
          <span>Name</span>
          <span>Short name</span>
          <span>Slug</span>
          <span>Order</span>
          <span>Listings</span>
          <span />
        </div>
        {categories.map((c) => (
          <CategoryRow
            key={c._id.toString()}
            category={{ id: c._id.toString(), name: c.name, shortName: c.shortName, slug: c.slug, order: c.order ?? 0 }}
            listings={countOf.get(c._id.toString()) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
