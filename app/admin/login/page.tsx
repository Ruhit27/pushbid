"use client";

import { useActionState } from "react";
import { Logo } from "@/app/_components/Logo";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { adminLogin } from "../actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, {});
  return (
    <main className="grid flex-1 place-items-center px-4 py-16">
      <form action={action} className="grid w-full max-w-sm gap-4 rounded-3xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">Admin</span>
            <ThemeToggle />
          </span>
        </div>
        <h1 className="text-xl font-semibold">Sign in to the admin panel</h1>
        <label className="grid gap-1 text-sm">
          Email
          <input name="email" type="email" required autoComplete="username" className="rounded-full border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="rounded-full border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        {state.error && <p className="rounded-2xl bg-brand-soft px-3 py-2 text-sm text-brand-strong">{state.error}</p>}
        <button disabled={pending} className="rounded-full bg-brand py-2.5 font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
