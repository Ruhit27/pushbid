"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { CategoryInfo } from "@/lib/boards";
import { CategoryIcon } from "./CategoryIcon";

/** A dropdown of Categories with their icons: a listbox that works with the keyboard and screen readers. */
export function CategorySelect({
  categories,
  value,
  onChange,
  disabled,
}: {
  categories: CategoryInfo[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = categories.find((c) => c.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    list.current?.focus();
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    setActive(Math.max(0, categories.findIndex((c) => c.id === value)));
    setOpen(true);
  }

  function choose(index: number) {
    onChange(categories[index].id);
    setOpen(false);
    trigger.current?.focus();
  }

  function onListKey(e: React.KeyboardEvent) {
    const last = categories.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => Math.min(last, active + 1),
      ArrowUp: () => Math.max(0, active - 1),
      Home: () => 0,
      End: () => last,
    };
    if (moves[e.key]) {
      e.preventDefault();
      setActive(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key.length === 1) {
      const next = categories.findIndex((c, i) => i > active && c.name.toLowerCase().startsWith(e.key.toLowerCase()));
      const wrap = categories.findIndex((c) => c.name.toLowerCase().startsWith(e.key.toLowerCase()));
      if (next >= 0 || wrap >= 0) setActive(next >= 0 ? next : wrap);
    }
  }

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={selected ? `Category: ${selected.name}` : "Choose a category"}
        className="flex h-12 w-full items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-left transition hover:border-fg/30 focus:border-brand focus:outline-none disabled:opacity-60"
      >
        {selected ? (
          <>
            <CategoryIcon icon={selected.icon} size={17} className="text-brand" />
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-muted">Choose a category</span>
        )}
        <ChevronDown size={18} className={`text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="Category"
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className="absolute z-30 mt-2 max-h-80 w-full min-w-72 overflow-y-auto rounded-3xl border border-line bg-surface p-1.5 shadow-xl outline-none"
        >
          {categories.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              data-index={i}
              role="option"
              aria-selected={c.id === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2 text-sm ${i === active ? "bg-surface-2" : ""} ${
                c.id === value ? "text-brand" : ""
              }`}
            >
              <CategoryIcon icon={c.icon} size={17} className="text-muted" />
              <span className="flex-1">{c.name}</span>
              {c.id === value && <Check size={16} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
