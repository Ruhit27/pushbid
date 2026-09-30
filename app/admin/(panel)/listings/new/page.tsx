import Link from "next/link";
import { getCategories } from "@/lib/boards";
import { ListingForm } from "../ListingForm";

export default async function NewListingPage() {
  const categories = await getCategories();
  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/listings" className="text-sm text-muted hover:text-fg">
          ← Listings
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Add listing</h1>
      </div>
      <ListingForm
        categories={categories}
        values={{ url: "", title: "", description: "", iconUrl: "", category: "", totalSpend: 10, hidden: false, demo: false }}
      />
    </div>
  );
}
