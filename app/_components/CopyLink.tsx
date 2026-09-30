"use client";

import { useState } from "react";

export function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-full border border-line px-5 py-2.5 font-semibold hover:border-fg"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
