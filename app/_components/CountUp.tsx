"use client";

import { useEffect, useState } from "react";

/** Counts up from zero to `value` once on mount, easing out over `duration` ms. Skips straight to the end for reduced motion. */
export function CountUp({ value, prefix = "", duration = 1400 }: { value: number; prefix?: string; duration?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const length = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let frame: number;
    const start = performance.now();
    const step = (now: number) => {
      const t = length ? Math.min(1, (now - start) / length) : 1;
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  const full = `${prefix}${value.toLocaleString("en-US")}`;
  return (
    <span aria-label={full}>
      <span aria-hidden="true">{`${prefix}${shown.toLocaleString("en-US")}`}</span>
    </span>
  );
}
