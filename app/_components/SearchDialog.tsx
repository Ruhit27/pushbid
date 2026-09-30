"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/app/api/search/route";
import { usd } from "@/lib/format";

/** The header's search button and the popup it opens. ⌘K / Ctrl+K opens it too. */
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** Results and the query they belong to, so stale or pending results are never shown as final. */
  const [result, setResult] = useState<{ q: string; hits: SearchHit[] } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const q = query.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        setResult({ q, hits: await res.json() });
      } catch {}
    }, 200);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q]);

  function close() {
    setOpen(false);
    setQuery("");
    setResult(null);
    trigger.current?.focus();
  }

  const hits = result?.q === q ? result.hits : null;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search listings"
        aria-haspopup="dialog"
        className="grid h-10 w-10 place-items-center rounded-full text-fg transition hover:bg-surface-2"
      >
        <Search size={19} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid items-start justify-items-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search listings"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              // Keep Tab inside the dialog.
              if (e.key === "Tab") {
                const items = e.currentTarget.querySelectorAll<HTMLElement>("input, a, button");
                const first = items[0];
                const last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search size={18} className="text-muted" aria-hidden="true" />
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search listings by name or link"
                aria-label="Search listings by name or link"
                className="h-14 flex-1 bg-transparent outline-none placeholder:text-muted"
              />
              <button type="button" onClick={close} aria-label="Close search" className="text-muted hover:text-fg">
                <X size={18} />
              </button>
            </div>
            {q.length >= 2 && (
              <ul className="max-h-[50vh] overflow-y-auto p-2" aria-live="polite">
                {hits === null ? (
                  <li className="px-3 py-6 text-center text-sm text-muted">Searching…</li>
                ) : hits.length ? (
                  hits.map((h) => (
                    <li key={h.slug}>
                      <Link href={`/product/${h.slug}`} onClick={close} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-surface-2 focus:bg-surface-2 focus:outline-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={h.iconUrl} alt="" className="h-9 w-9 rounded-xl object-contain" referrerPolicy="no-referrer" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{h.title}</span>
                          <span className="block truncate text-xs text-muted">{h.link}</span>
                        </span>
                        <span className="font-semibold text-brand tabular-nums">{usd(h.spend)}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-6 text-center text-sm text-muted">No listings match &ldquo;{q}&rdquo;.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
