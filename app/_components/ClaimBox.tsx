"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { claimAction, previewAction, signInWithGoogle, type PreviewResult } from "@/app/actions";
import type { CategoryInfo } from "@/lib/boards";
import { usd } from "@/lib/format";
import { MAX_SPEND, MIN_NEW_LISTING } from "@/lib/rules";

type Props = {
  categories: CategoryInfo[];
  /** What it costs to take #1 on the board this box sits on. */
  firstAmount: number;
  initialAmount?: number;
  board: "all-time" | "today";
  defaultCategoryId?: string;
  signedIn: boolean;
  credits: number;
  signInNext: string;
};

type Ready = Extract<PreviewResult, { ok: true }>;

export function ClaimBox(props: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(Math.min(MAX_SPEND, Math.max(MIN_NEW_LISTING, props.initialAmount ?? props.firstAmount)));
  const [link, setLink] = useState("");
  const [categoryId, setCategoryId] = useState(props.defaultCategoryId ?? "");
  const [preview, setPreview] = useState<Ready | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { slug: string; rank: number; charge: number }>(null);
  const [pending, startTransition] = useTransition();

  const charge = preview?.existing ? amount - preview.existing.totalSpend : amount;
  const heading = amount >= props.firstAmount ? "#1" : "a rank";

  function step(delta: number) {
    setAmount((a) => Math.min(MAX_SPEND, Math.max(1, a + delta)));
  }

  function check() {
    setError("");
    setDone(null);
    startTransition(async () => {
      const res = await previewAction(link);
      if (!res.ok) {
        setPreview(null);
        setError(res.error);
        return;
      }
      setPreview(res);
      setTitle(res.title);
      setDescription(res.description);
      if (res.existing && amount <= res.existing.totalSpend) setAmount(res.existing.totalSpend + 1);
    });
  }

  function claim() {
    if (!preview) return;
    setError("");
    startTransition(async () => {
      const res = await claimAction({ link, targetTotal: amount, title, description, iconUrl: preview.iconUrl, categoryId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(res);
      setPreview(null);
      setLink("");
      router.refresh();
    });
  }

  return (
    <section id="claim" className="scroll-mt-24 rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Claim {props.board === "today" ? `today's ${heading}` : heading} for
        </h2>
        <div className="flex items-center overflow-hidden rounded-xl border border-line bg-bg">
          <button type="button" onClick={() => step(-1)} className="px-3 py-2 text-lg font-bold text-muted hover:text-fg" aria-label="Decrease">
            −
          </button>
          <label className="flex items-center text-2xl font-extrabold tabular-nums">
            <span className="text-brand">$</span>
            <span className="sr-only">Amount in dollars</span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                setAmount(Math.min(MAX_SPEND, n));
              }}
              className="w-[7ch] bg-transparent px-1 py-1.5 outline-none"
            />
          </label>
          <button type="button" onClick={() => step(1)} className="px-3 py-2 text-lg font-bold text-muted hover:text-fg" aria-label="Increase">
            +
          </button>
        </div>
      </div>

      <form
        className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (props.signedIn) check();
        }}
      >
        <input
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setPreview(null);
          }}
          placeholder="yourproduct.com or @handle"
          className="rounded-xl border border-line bg-bg px-4 py-3 outline-none focus:border-brand"
          aria-label="Product link or X handle"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-3 outline-none focus:border-brand"
          aria-label="Category"
          disabled={!!preview?.existing}
        >
          <option value="">Choose a category</option>
          {props.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {props.signedIn ? (
          <button
            disabled={pending || !link.trim() || !!preview}
            className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:bg-brand-strong disabled:opacity-50"
          >
            {pending && !preview ? "Checking…" : "Claim rank"}
          </button>
        ) : null}
      </form>

      {!props.signedIn && (
        <form action={signInWithGoogle} className="mt-3">
          <input type="hidden" name="next" value={props.signInNext} />
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-fg px-5 py-3 font-bold text-bg hover:opacity-90">
            <GoogleIcon /> Sign in with Google to claim — new accounts get free credits
          </button>
        </form>
      )}

      {error && <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand-strong">{error}</p>}

      {done && (
        <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm">
          Claimed! Your listing is now <strong>#{done.rank}</strong> on the All-time board ({usd(done.charge)} spent).{" "}
          <Link href={`/product/${done.slug}`} className="font-semibold text-brand underline">
            See it
          </Link>
        </p>
      )}

      {preview && (
        <div className="mt-4 rounded-2xl border border-brand/40 bg-bg p-4">
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.iconUrl} alt="" className="h-12 w-12 rounded-lg border border-line object-contain" referrerPolicy="no-referrer" />
            <div className="min-w-0 flex-1 grid gap-2">
              {preview.existing ? (
                <>
                  <p className="font-bold">{preview.existing.title}</p>
                  <p className="text-sm text-muted">
                    Already on the board at <strong className="text-fg">#{preview.existing.rank}</strong> with{" "}
                    <strong className="text-fg">{usd(preview.existing.totalSpend)}</strong> in {preview.existing.category}. Raising it to{" "}
                    {usd(amount)} charges only the difference.
                  </p>
                </>
              ) : (
                <>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    className="rounded-lg border border-line bg-surface px-3 py-2 font-bold outline-none focus:border-brand"
                    aria-label="Title"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={300}
                    rows={2}
                    placeholder="One or two sentences about your product"
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                    aria-label="Description"
                  />
                  <p className="truncate text-xs text-muted">{preview.url}</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              You pay <strong className="text-fg">{usd(Math.max(0, charge))}</strong> · balance {usd(props.credits)}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPreview(null)} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-fg">
                Cancel
              </button>
              <button
                type="button"
                onClick={claim}
                disabled={pending || charge < 1 || (!preview.existing && !categoryId)}
                className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-50"
              >
                {pending ? "Claiming…" : `Pay ${usd(Math.max(0, charge))} & claim`}
              </button>
            </div>
          </div>
          {!preview.existing && !categoryId && <p className="mt-2 text-xs text-brand-strong">Choose a category first.</p>}
          <p className="mt-3 text-xs text-muted">
            Claims are final. By claiming you agree to the <Link href="/rules" className="underline">rules</Link> and{" "}
            <Link href="/terms" className="underline">terms</Link>.
          </p>
        </div>
      )}
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
