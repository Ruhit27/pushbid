"use client";

import { Globe, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { claimAction, previewAction, signInWithGoogle, type PreviewResult } from "@/app/actions";
import type { BoardKind, CategoryInfo } from "@/lib/boards";
import { usd } from "@/lib/format";
import { MAX_SPEND, MIN_NEW_LISTING } from "@/lib/rules";
import { CategorySelect } from "./CategorySelect";

type Props = {
  categories: CategoryInfo[];
  /** What it takes to be #1 on the Board this box sits on. */
  firstAmount: number;
  initialAmount?: number;
  board: BoardKind;
  defaultCategoryId?: string;
  signedIn: boolean;
  credits: number;
  signInNext: string;
};

type Ready = Extract<PreviewResult, { ok: true }>;

/** What a signed-out visitor typed, kept across the Google sign-in round trip. */
const DRAFT_KEY = "claim-draft";
type Draft = { link: string; categoryId: string; amount: number; savedAt: number };
/** A draft left behind by a sign-in that never finished is dropped after this long. */
const DRAFT_TTL_MS = 15 * 60 * 1000;

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
  const signInForm = useRef<HTMLFormElement>(null);

  // Bring back what the visitor typed before signing in.
  useEffect(() => {
    if (!props.signedIn) return;
    let draft: Draft | null = null;
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
    if (!draft?.link || Date.now() - (draft.savedAt ?? 0) > DRAFT_TTL_MS) return;
    const d = draft;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage after sign-in
    setLink(d.link);
    if (d.categoryId) setCategoryId(d.categoryId);
    if (Number.isInteger(d.amount)) setAmount(Math.min(MAX_SPEND, Math.max(MIN_NEW_LISTING, d.amount)));
  }, [props.signedIn]);

  const charge = preview?.existing ? amount - preview.existing.totalSpend : amount;
  const heading = amount >= props.firstAmount ? "#1" : "a rank";

  function step(delta: number) {
    setAmount((a) => Math.min(MAX_SPEND, Math.max(1, a + delta)));
  }

  function submit() {
    setError("");
    setDone(null);
    if (!props.signedIn) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ link, categoryId, amount, savedAt: Date.now() } satisfies Draft));
      } catch {}
      signInForm.current?.requestSubmit();
      return;
    }
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

  const roundButton =
    "grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-brand transition hover:bg-brand hover:text-white sm:h-7 sm:w-7";

  return (
    <section id="claim" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Claim {props.board === "today" ? `today's ${heading}` : heading} for
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} className={roundButton} aria-label="Decrease amount">
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <label className="flex items-center text-3xl font-semibold tabular-nums text-brand sm:text-4xl">
            <span>$</span>
            <span className="sr-only">Amount in dollars</span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(Math.min(MAX_SPEND, Number(e.target.value.replace(/\D/g, ""))))}
              size={Math.max(2, String(amount).length)}
              className="min-w-[2ch] bg-transparent outline-none [field-sizing:content]"
            />
          </label>
          <button type="button" onClick={() => step(1)} className={roundButton} aria-label="Increase amount">
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <form
        className="mx-auto mt-6 grid grid-cols-1 max-w-3xl gap-2.5 md:grid-cols-[1fr_260px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="flex h-12 items-center gap-2.5 rounded-full border border-line bg-surface px-2 transition focus-within:border-brand">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-muted">
            <Globe size={16} strokeWidth={1.75} />
          </span>
          <input
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setPreview(null);
            }}
            placeholder="Your product URL or @handle"
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
            aria-label="Product link or X handle"
          />
        </label>
        <CategorySelect categories={props.categories} value={categoryId} onChange={setCategoryId} disabled={!!preview?.existing} />
        <button
          disabled={pending || !link.trim() || !!preview}
          className="h-12 whitespace-nowrap rounded-full bg-brand px-6 font-semibold text-white transition hover:bg-brand-strong disabled:opacity-45"
        >
          {pending && !preview ? "Checking…" : "Claim rank"}
        </button>
      </form>

      <form ref={signInForm} action={signInWithGoogle} className="hidden">
        <input type="hidden" name="next" value={`${props.signInNext}#claim`} />
      </form>

      <div className="mx-auto max-w-3xl">
        {!props.signedIn && (
          <p className="mt-3 text-center text-sm text-muted">You&apos;ll sign in with Google to claim. New accounts get free credits.</p>
        )}

        {error && <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-strong">{error}</p>}

        {done && (
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm">
            Claimed! Your listing is now <strong>#{done.rank}</strong> on the All-time board ({usd(done.charge)} spent).{" "}
            <Link href={`/product/${done.slug}`} className="font-semibold text-brand underline">
              See it
            </Link>
          </p>
        )}

        {preview && (
          <div className="mt-5 rounded-[28px] bg-brand-soft p-5">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.iconUrl} alt="" className="h-16 w-16 rounded-2xl bg-surface object-contain" referrerPolicy="no-referrer" />
              <div className="grid min-w-0 flex-1 gap-2">
                {preview.existing ? (
                  <>
                    <p className="text-lg font-semibold">{preview.existing.title}</p>
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
                      className="rounded-2xl border border-line bg-surface px-4 py-2.5 font-semibold outline-none focus:border-brand"
                      aria-label="Title"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder="One or two sentences about your product"
                      className="rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
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
                <button type="button" onClick={() => setPreview(null)} className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold hover:border-fg">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={claim}
                  disabled={pending || charge < 1 || (!preview.existing && !categoryId)}
                  className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-45"
                >
                  {pending ? "Claiming…" : `Pay ${usd(Math.max(0, charge))} & claim`}
                </button>
              </div>
            </div>
            {!preview.existing && !categoryId && <p className="mt-2 text-xs font-medium text-brand-strong">Choose a category first.</p>}
            <p className="mt-3 text-xs text-muted">
              Claims are final. By claiming you agree to the{" "}
              <Link href="/rules" className="underline">
                rules
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="underline">
                terms
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
