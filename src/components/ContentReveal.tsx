"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { useResolvedTheme } from "./ThemeProvider";

/**
 * Replays the page's on-load entrance — the Reveal cascade, the hero's card
 * flights, every mount-driven reveal under here — each time the RESOLVED theme
 * flips. Switching light ↔ dark (or a device-mode OS flip) re-plays the whole
 * appearance sequence over the newly themed background, exactly as a reload does.
 *
 * Mechanism: a `key` bound to a replay counter wraps the content; bumping the
 * counter remounts the subtree, so every child's `initial → animate` runs again.
 * The wrapper is `display: contents` (adds no box), so the page sections stay the
 * card's direct flex children and layout is untouched. Only the content inside
 * the card remounts — the card itself (bg, rounded seam, shadow) is above this.
 *
 * It bumps ONLY on a genuine theme change, never on load. The first effect run
 * adopts the theme already stamped on <html> by the init script, so the hook
 * settling from its hydration-safe default to the real theme right after mount is
 * not mistaken for a change. Reduced motion opts out entirely — the theme swaps
 * with no remount (content simply re-colors in place).
 */
export function ContentReveal({ children }: { children: ReactNode }) {
  const resolved = useResolvedTheme();
  const reduce = useReducedMotion();
  const [replay, setReplay] = useState(0);
  // The theme the mounted subtree was last built for. Null until the first effect
  // adopts the real stamped value (see below).
  const builtFor = useRef<string | null>(null);

  useEffect(() => {
    if (reduce) return; // reduced motion never remounts — just re-colors
    if (builtFor.current === null) {
      // First settle: adopt whatever the init script already stamped on <html>,
      // so the hook's hydration swap (light default → real theme) isn't read as a
      // user change and the entrance doesn't double-play on a fresh dark load.
      builtFor.current =
        document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      return;
    }
    if (builtFor.current !== resolved) {
      builtFor.current = resolved;
      setReplay((n) => n + 1); // remount → the entrance plays again
    }
  }, [resolved, reduce]);

  return (
    <div key={replay} className="contents">
      {children}
    </div>
  );
}
