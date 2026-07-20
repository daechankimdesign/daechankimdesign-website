"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { drawHighlight } from "@/lib/highlight";

/**
 * Bold text with the site's hand-drawn highlighter behind it — the SAME mark as
 * the work-tile hover and the hero. Instead of hover, the mark SKETCHES IN once,
 * the moment the phrase scrolls into view, and then stays.
 *
 * Structure mirrors WorkTile: `.hl-host` (position:relative) anchors
 * rough-notation's absolutely-positioned SVG to THIS phrase — not a transformed
 * ancestor like a RevealBlock, whose transform would otherwise become the SVG's
 * containing block and shift the mark. `.hl-mark` carries `z-index:1` (globals)
 * so the text always sits ABOVE the translucent marker and stays crisp.
 *
 * Reduced motion draws the mark instantly (no sketch). The annotation is removed
 * on unmount so nothing leaks across client navigations.
 */
export function Highlighter({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  // Fire once, when the phrase is comfortably into view (its top past ~25% up
  // from the viewport bottom), so the mark draws as the text settles in.
  const inView = useInView(hostRef, {
    once: true,
    margin: "0px 0px -25% 0px",
  });

  useEffect(() => {
    if (!inView) return;
    const { remove } = drawHighlight(markRef.current, { instant: !!reduce });
    return remove;
  }, [inView, reduce]);

  return (
    <strong ref={hostRef} className="hl-host">
      <span ref={markRef} className="hl-mark">
        {children}
      </span>
    </strong>
  );
}
