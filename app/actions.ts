"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth, signIn, signOut } from "@/auth";
import { ClaimError, makeClaim } from "@/lib/claims";
import { connectDb } from "@/lib/db";
import { fallbackIcon, previewLink, resolveLink } from "@/lib/fetch-meta";
import { LinkError } from "@/lib/link";
import { Category, Listing, User, type CategoryDoc, type ListingDoc } from "@/lib/models";
import { listingRanks } from "@/lib/boards";

export type PreviewResult =
  | { ok: false; error: string }
  | {
      ok: true;
      key: string;
      url: string;
      title: string;
      description: string;
      iconUrl: string;
      existing: null | { slug: string; title: string; totalSpend: number; rank: number; category: string };
    };

export async function previewAction(input: string): Promise<PreviewResult> {
  const session = await auth();
  if (!session?.user.id) return { ok: false, error: "Sign in to make a Claim." };
  try {
    const link = await resolveLink(input);
    await connectDb();
    const existing = await Listing.findOne({ key: link.key }).lean<ListingDoc>();
    if (existing?.hidden) return { ok: false, error: "This listing has been removed from the board." };
    if (existing) {
      const [ranks, cat] = await Promise.all([
        listingRanks(existing),
        Category.findById(existing.category).lean<CategoryDoc>(),
      ]);
      return {
        ok: true,
        key: existing.key,
        url: existing.url,
        title: existing.title,
        description: existing.description ?? "",
        iconUrl: existing.iconUrl || fallbackIcon(link),
        existing: { slug: existing.slug, title: existing.title, totalSpend: existing.totalSpend, rank: ranks.overall, category: cat?.name ?? "" },
      };
    }
    const preview = await previewLink(input);
    return { ok: true, key: preview.key, url: preview.url, title: preview.title, description: preview.description, iconUrl: preview.iconUrl, existing: null };
  } catch (err) {
    if (err instanceof LinkError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "We couldn't check that link. Try again." };
  }
}

export type ClaimActionResult =
  | { ok: false; error: string }
  | { ok: true; slug: string; charge: number; rank: number; totalSpend: number };

export async function claimAction(input: {
  link: string;
  targetTotal: number;
  title: string;
  description: string;
  iconUrl: string;
  categoryId: string;
}): Promise<ClaimActionResult> {
  const session = await auth();
  if (!session?.user.id) return { ok: false, error: "Sign in to make a Claim." };
  try {
    const link = await resolveLink(input.link);
    const iconUrl = /^https:\/\//.test(input.iconUrl) ? input.iconUrl : fallbackIcon(link);
    const result = await makeClaim({
      userId: session.user.id,
      link,
      targetTotal: Number(input.targetTotal),
      details: { title: String(input.title), description: String(input.description), iconUrl, categoryId: String(input.categoryId) },
    });
    revalidatePath("/", "layout");
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof LinkError || err instanceof ClaimError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Your Credits were not charged." };
  }
}

export async function signInWithGoogle(formData: FormData) {
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) redirect("/signin?error=Configuration");
  const next = String(formData.get("next") ?? "/");
  await signIn("google", { redirectTo: next.startsWith("/") && !next.startsWith("//") ? next : "/" });
}

/** Marks the signed-in user's sign-in popup as seen. */
export async function dismissWelcome() {
  const session = await auth();
  if (!session?.user.id || !isValidObjectId(session.user.id)) return;
  await connectDb();
  await User.updateOne({ _id: session.user.id }, { pendingWelcome: null });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
