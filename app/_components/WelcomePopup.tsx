"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dismissWelcome } from "@/app/actions";
import { chime, confettiBurst } from "./celebrate";

const TOAST_MS = 5000;

/**
 * Shows the sign-in welcome once. After signing in from the claim box (the page opens at #claim) it is a
 * corner toast instead, so it doesn't cover the Claim in progress. The popup opens with confetti and a chime,
 * a bigger burst for a new user.
 */
export function WelcomePopup(props: {
  title: string;
  toast: string;
  claimLabel: string | null;
  bigCelebration?: boolean;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<"popup" | "toast" | "closed" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  function close() {
    setMode("closed");
    dismissWelcome();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hash is only readable after mount
    setMode(location.hash === "#claim" ? "toast" : "popup");
  }, []);

  useEffect(() => {
    if (mode === "popup") {
      dialog.current?.showModal();
      if (canvas.current) confettiBurst(canvas.current, !!props.bigCelebration);
      // Sound is blocked until the visitor interacts, so if it didn't play, play it on their first click.
      chime().then((played) => {
        if (!played) window.addEventListener("pointerdown", () => void chime(), { once: true, capture: true });
      });
      return;
    }
    if (mode !== "toast") return;
    const id = setTimeout(() => {
      setMode("closed");
      dismissWelcome();
    }, TOAST_MS);
    return () => clearTimeout(id);
  }, [mode, props.bigCelebration]);

  if (mode === "toast") {
    return (
      <div role="status" className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium shadow-xl">
        {props.toast}
        <button onClick={close} aria-label="Dismiss" className="text-muted hover:text-fg">
          ✕
        </button>
      </div>
    );
  }
  if (mode !== "popup") return null;

  return (
    <dialog
      ref={dialog}
      onClose={close}
      // A backdrop click or following any link inside closes it.
      onClick={(e) => (e.target === dialog.current || (e.target as Element).closest("a")) && dialog.current?.close()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-surface p-6 text-fg shadow-xl backdrop:bg-black/50"
    >
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full" />
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">{props.title}</h2>
      {props.children}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button onClick={() => dialog.current?.close()} className="rounded-full px-4 py-2.5 text-sm font-medium text-muted hover:text-fg">
          {props.claimLabel ? "Maybe later" : "Close"}
        </button>
        {props.claimLabel && (
          <Link
            href="/#claim"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            {props.claimLabel}
          </Link>
        )}
      </div>
    </dialog>
  );
}
