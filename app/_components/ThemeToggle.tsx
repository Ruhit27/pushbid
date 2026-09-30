"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_KEY } from "@/lib/theme";

/** Flips between light and dark and remembers the choice. Starts from the system setting. */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch light or dark theme"
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-fg shadow-[0_0_0_3px_var(--brand-soft)] transition hover:border-brand"
    >
      <Moon size={18} strokeWidth={1.75} className="dark:hidden" />
      <Sun size={18} strokeWidth={1.75} className="hidden dark:block" />
    </button>
  );
}
