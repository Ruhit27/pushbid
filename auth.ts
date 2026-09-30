import { createHash, timingSafeEqual } from "node:crypto";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models";
import { STARTING_CREDITS } from "@/lib/rules";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "user" | "admin" } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string | null;
    role?: "user" | "admin";
  }
}

const digest = (value: string) => createHash("sha256").update(value).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    Google,
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: { email: {}, password: {} },
      authorize(credentials) {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) return null;
        const givenEmail = String(credentials?.email ?? "").trim().toLowerCase();
        const givenPassword = String(credentials?.password ?? "");
        const ok = sameSecret(givenEmail, email.toLowerCase()) && sameSecret(givenPassword, password);
        return ok ? { id: "admin", email, name: "Admin" } : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "admin") {
        token.role = "admin";
        token.uid = null;
      } else if (account?.provider === "google") {
        const email = (profile?.email ?? token.email ?? "").toLowerCase();
        await connectDb();
        const user = await User.findOneAndUpdate(
          { email },
          {
            $set: { name: profile?.name ?? token.name ?? "", image: (profile?.picture as string) ?? token.picture ?? "" },
            $setOnInsert: { email, credits: STARTING_CREDITS },
          },
          { upsert: true, returnDocument: "after" },
        );
        token.role = "user";
        token.uid = user._id.toString();
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid ?? "";
      session.user.role = token.role ?? "user";
      return session;
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "admin") throw new Error("Admins only.");
  return session;
}
