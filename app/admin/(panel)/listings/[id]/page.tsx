import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getCategories } from "@/lib/boards";
import { connectDb } from "@/lib/db";
import { Listing, type ListingDoc } from "@/lib/models";
import { ListingForm } from "../ListingForm";
import { DeleteListingForm } from "./DeleteListingForm";

export default async function EditListingPage({ params }: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectDb();
  const [listing, categories] = await Promise.all([Listing.findById(id).lean<ListingDoc>(), getCategories()]);
  if (!listing) notFound();
  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/listings" className="text-sm text-muted hover:text-fg">
          ← Listings
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Edit listing</h1>
        {!listing.hidden && (
          <Link href={`/product/${listing.slug}`} className="text-sm text-brand hover:underline">
            View on site ↗
          </Link>
        )}
      </div>
      <ListingForm
        categories={categories}
        values={{
          id,
          url: listing.url,
          title: listing.title,
          description: listing.description ?? "",
          iconUrl: listing.iconUrl ?? "",
          category: listing.category.toString(),
          totalSpend: listing.totalSpend,
          hidden: listing.hidden,
          demo: listing.demo,
        }}
      />
      <DeleteListingForm id={id} title={listing.title} />
    </div>
  );
}
