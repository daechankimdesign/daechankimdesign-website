"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, DURATION, STAGGER } from "@/lib/motion";

const HIDDEN = { opacity: 0, y: 24 } as const;
const SHOW = { opacity: 1, y: 0 } as const;
// Reveal slightly before fully on-screen so it reads as settled by the time the
// reader reaches it (matches RevealBlock).
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

/**
 * Per-tile scroll reveal with a reading-order STAGGER, for the work board. Tiles
 * already on screen at load cascade in one after another (delay = index × STAGGER)
 * instead of all at once; tiles below the fold reveal promptly the moment they
 * scroll into view (delay cleared to 0), so scrolling to a lower tile never lags
 * — the same policy RevealBlock uses for long-form body blocks. The ref measures
 * once at commit, before the whileInView observer can fire. Reduced motion → the
 * tile renders plain and fully visible.
 */
export function RevealTile({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  // Default to the staggered delay; cleared to 0 for any tile that starts below
  // the fold, so it reveals immediately on scroll-in rather than after a stale wait.
  const [delay, setDelay] = useState<number>(index * STAGGER);
  const measured = useRef(false);
  const measure = useCallback((node: HTMLElement | null) => {
    if (!node || measured.current) return;
    measured.current = true;
    if (node.getBoundingClientRect().top >= window.innerHeight) setDelay(0);
  }, []);

  if (reduce) return <>{children}</>;
  return (
    <motion.div
      ref={measure}
      initial={HIDDEN}
      whileInView={SHOW}
      viewport={VIEWPORT}
      transition={{ duration: DURATION, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
