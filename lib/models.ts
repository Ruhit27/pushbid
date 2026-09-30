import mongoose, { Schema, type Model, type Types } from "mongoose";

// Explicit document types: inferring them from the schemas makes the TypeScript checker run out of memory.

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  name: string;
  image: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDoc {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  shortName: string;
  order: number;
}

export interface ListingDoc {
  _id: Types.ObjectId;
  key: string;
  slug: string;
  url: string;
  kind: "site" | "x";
  title: string;
  description: string;
  iconUrl: string;
  category: Types.ObjectId;
  /** All-time Spend. */
  totalSpend: number;
  /** When the Listing reached its current All-time Spend; breaks ties in favour of whoever got there first. */
  spendSince: Date;
  raises: number;
  clicks: number;
  hidden: boolean;
  demo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimDoc {
  _id: Types.ObjectId;
  listing: Types.ObjectId;
  user: Types.ObjectId | null;
  amount: number;
  /** UTC calendar day the Claim counts toward, as YYYY-MM-DD. */
  day: string;
  /** All-time Rank the Listing held right after this Claim. */
  rankAfter: number;
  demo: boolean;
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    credits: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

const categorySchema = new Schema<CategoryDoc>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const listingSchema = new Schema<ListingDoc>(
  {
    key: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    kind: { type: String, enum: ["site", "x"], default: "site" },
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 300 },
    iconUrl: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    totalSpend: { type: Number, required: true, default: 0, min: 0 },
    spendSince: { type: Date, required: true, default: () => new Date() },
    raises: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    demo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
listingSchema.index({ hidden: 1, totalSpend: -1, spendSince: 1 });
listingSchema.index({ category: 1, hidden: 1, totalSpend: -1, spendSince: 1 });

const claimSchema = new Schema<ClaimDoc>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    amount: { type: Number, required: true, min: 1 },
    day: { type: String, required: true },
    rankAfter: { type: Number, required: true },
    demo: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
claimSchema.index({ day: 1, listing: 1 });
claimSchema.index({ createdAt: -1 });
claimSchema.index({ user: 1, createdAt: -1 });
claimSchema.index({ listing: 1, createdAt: -1 });

function model<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

export const User = model<UserDoc>("User", userSchema);
export const Category = model<CategoryDoc>("Category", categorySchema);
export const Listing = model<ListingDoc>("Listing", listingSchema);
export const Claim = model<ClaimDoc>("Claim", claimSchema);
