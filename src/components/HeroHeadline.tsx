"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { RotatingText } from "./RotatingText";

// Phrase interval (matches RotatingText's default) — paces the steady base flow.
const INTERVAL_MS = 3000;
// How snappily the scroll chases its target (ms). Smaller = more reactive.
const CHASE_TAU = 320;
// Scroll distance (%) for one full palette cycle. MUST equal the gradient
// period in the .hero-fill-text rule so the loop is seamless.
const CYCLE_TRAVEL = 600;

/**
 * Hero headline. "end-to-end" shows the palette scrolling across it, left →
 * right, forward only. A monotonic target (in palette cycles) drives the scroll
 * and (a) advances steadily on its own — one cycle per phrase cycle (≈12s) —
 * and (b) gets a forward nudge on every mouse/scroll-driven word change, so the
 * colour visibly reacts to the trigger. The clause rotates below; on small
 * screens the name breaks onto its own line.
 */
export function HeroHeadline({ phrases }: { phrases: string[] }) {
  const reduce = useReducedMotion();
  const fillRef = useRef<HTMLSpanElement>(null);
  // Monotonic target in palette cycles (one cycle = 7E8FED → … → 7E8FED).
  const targetRef = useRef(0);

  // A scrub-driven word change nudges the scroll forward by part of a cycle.
  const nudge = useCallback(() => {
    targetRef.current += 1 / Math.max(1, phrases.length);
  }, [phrases.length]);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    if (reduce || phrases.length === 0) {
      el.style.setProperty("--hero-travel", "0%");
      return;
    }

    // One full palette cycle per phrase cycle (≈12s).
    const baseRate = 1 / (phrases.length * INTERVAL_MS); // cycles per ms
    let current = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // Target always flows forward (base), plus any nudges already applied.
      targetRef.current += baseRate * dt;
      // Chase it; the target only increases, so the scroll never reverses.
      current += (targetRef.current - current) * (1 - Math.exp(-dt / CHASE_TAU));
      // Wrap within one cycle; CYCLE_TRAVEL% ≡ 0% (palette repeats) = seamless.
      const travel = (current * CYCLE_TRAVEL) % CYCLE_TRAVEL;
      el.style.setProperty("--hero-travel", `${travel.toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, phrases.length]);

  return (
    <>
      <span className="block">
        Daechan,
        {/* Small screens break after the name; large keeps it on one line. */}
        <br className="md:hidden" />{" "}
        an{" "}
        <span ref={fillRef} className="hero-fill-text whitespace-nowrap">
          end-to-end
        </span>{" "}
        product designer
      </span>
      <RotatingText phrases={phrases} onAdvance={nudge} />
    </>
  );
}
