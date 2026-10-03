import type { Metadata } from "next";
import { signInWithGoogle } from "@/app/actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/";
  const error = typeof sp.error === "string" ? sp.error : "";
  return (
    <div className="mx-auto grid max-w-sm gap-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to Push Bid</h1>
      <p className="text-muted">Sign in to put your product on the board.</p>
      {error && (
        <p className="rounded-2xl bg-brand-soft px-3 py-2 text-sm text-brand-strong">
          {error === "Configuration"
            ? "Google sign-in isn't set up yet. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env.local (see README)."
            : "Sign-in failed. Please try again."}
        </p>
      )}
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button className="w-full rounded-full bg-fg px-5 py-3 font-semibold text-bg hover:opacity-90">Continue with Google</button>
      </form>
    </div>
  );
}
