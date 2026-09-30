import "server-only";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDb } from "./db";
import { User, type UserDoc } from "./models";

export type Viewer = { id: string; name: string; email: string; image: string; credits: number } | null;

/** The signed-in user with their current Credits, or null for visitors and the Admin. */
export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  const id = session?.user.id;
  if (!id || !isValidObjectId(id)) return null;
  await connectDb();
  const user = await User.findById(id).lean<UserDoc>();
  if (!user) return null;
  return { id, name: user.name ?? "", email: user.email, image: user.image ?? "", credits: user.credits };
}
