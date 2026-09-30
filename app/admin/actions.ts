"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { requireAdmin, signIn, signOut } from "@/auth";
import { connectDb } from "@/lib/db";
import { fallbackIcon } from "@/lib/fetch-meta";
import { LinkError, normalizeLink, slugFromKey } from "@/lib/link";
import { Category, Claim, Listing, User } from "@/lib/models";
import { MAX_SPEND } from "@/lib/rules";

export type FormState = { error?: string; ok?: string };

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("admin", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Wrong email or password." };
    throw err;
  }
  return {};
}

export async function adminLogout() {
  await signOut({ redirectTo: "/admin/login" });
}

function refreshAll() {
  revalidatePath("/", "layout");
}

const text = (fd: FormData, name: string, max: number) => String(fd.get(name) ?? "").trim().slice(0, max);

function spendFrom(fd: FormData): number | string {
  const spend = Number(fd.get("totalSpend"));
  if (!Number.isInteger(spend) || spend < 0 || spend > MAX_SPEND) return `Spend must be a whole number from 0 to ${MAX_SPEND}.`;
  return spend;
}

export async function saveListing(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  await connectDb();
  const id = String(fd.get("id") ?? "");
  const title = text(fd, "title", 120);
  const categoryId = String(fd.get("category") ?? "");
  const spend = spendFrom(fd);
  if (typeof spend === "string") return { error: spend };
  if (!title) return { error: "Title is required." };
  if (!isValidObjectId(categoryId) || !(await Category.exists({ _id: categoryId }))) return { error: "Choose a category." };

  let link;
  try {
    link = normalizeLink(String(fd.get("url") ?? ""));
  } catch (err) {
    return { error: err instanceof LinkError ? err.message : "Invalid link." };
  }

  const clash = await Listing.findOne({ key: link.key, ...(id ? { _id: { $ne: id } } : {}) });
  if (clash) return { error: `Another listing already uses this link: "${clash.title}".` };

  const fields = {
    key: link.key,
    slug: slugFromKey(link.key),
    url: link.url,
    kind: link.kind,
    title,
    description: text(fd, "description", 300),
    iconUrl: text(fd, "iconUrl", 500) || fallbackIcon(link),
    category: categoryId,
    hidden: fd.get("hidden") === "on",
    demo: fd.get("demo") === "on",
  };

  if (id) {
    const current = await Listing.findById(id);
    if (!current) return { error: "Listing not found." };
    current.set(fields);
    // Reaching a new, higher Spend moves the Listing to the back of any tie; lowering it keeps its place in line.
    if (spend > current.totalSpend) current.spendSince = new Date();
    current.totalSpend = spend;
    await current.save();
  } else {
    await Listing.create({ ...fields, totalSpend: spend, spendSince: new Date() });
  }
  refreshAll();
  redirect("/admin/listings");
}

/** Deletes a Listing and its Claims. Listings with users' Claims can only be hidden, so their history survives. */
export async function deleteListing(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  await connectDb();
  const id = String(fd.get("id") ?? "");
  if (!isValidObjectId(id)) return { error: "Unknown listing." };
  const userClaims = await Claim.countDocuments({ listing: id, user: { $ne: null } });
  if (userClaims) {
    return { error: `Users have made ${userClaims} Claim${userClaims === 1 ? "" : "s"} on this listing. Hide it instead, so their history stays intact.` };
  }
  await Promise.all([Listing.deleteOne({ _id: id }), Claim.deleteMany({ listing: id })]);
  refreshAll();
  redirect("/admin/listings");
}

export async function toggleHidden(fd: FormData) {
  await requireAdmin();
  await connectDb();
  const id = String(fd.get("id") ?? "");
  if (!isValidObjectId(id)) return;
  const listing = await Listing.findById(id);
  if (!listing) return;
  listing.hidden = !listing.hidden;
  await listing.save();
  refreshAll();
}

export async function deleteDemoData(): Promise<void> {
  await requireAdmin();
  await connectDb();
  const demo = await Listing.find({ demo: true }, { _id: 1 });
  const ids = demo.map((l) => l._id);
  await Promise.all([Claim.deleteMany({ $or: [{ demo: true }, { listing: { $in: ids } }] }), Listing.deleteMany({ _id: { $in: ids } })]);
  refreshAll();
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  await connectDb();
  const id = String(fd.get("id") ?? "");
  const name = text(fd, "name", 60);
  const shortName = text(fd, "shortName", 20) || name;
  const order = Number(fd.get("order") ?? 0) || 0;
  if (!name) return { error: "Name is required." };
  const slug = slugify(text(fd, "slug", 60) || name);
  const clash = await Category.findOne({ slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (clash) return { error: `The slug "${slug}" is already used.` };
  if (id) await Category.updateOne({ _id: id }, { name, shortName, slug, order });
  else await Category.create({ name, shortName, slug, order });
  refreshAll();
  return { ok: id ? "Saved." : `Added ${name}.` };
}

export async function deleteCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  await connectDb();
  const id = String(fd.get("id") ?? "");
  if (!isValidObjectId(id)) return { error: "Unknown category." };
  const used = await Listing.countDocuments({ category: id });
  if (used) return { error: `Move its ${used} listing${used === 1 ? "" : "s"} to another category first.` };
  await Category.deleteOne({ _id: id });
  refreshAll();
  return { ok: "Deleted." };
}

export async function setCredits(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  await connectDb();
  const id = String(fd.get("id") ?? "");
  const credits = Number(fd.get("credits"));
  if (!isValidObjectId(id)) return { error: "Unknown user." };
  if (!Number.isInteger(credits) || credits < 0) return { error: "Credits must be a whole number, 0 or more." };
  await User.updateOne({ _id: id }, { credits });
  revalidatePath("/admin/users");
  return { ok: "Saved." };
}
