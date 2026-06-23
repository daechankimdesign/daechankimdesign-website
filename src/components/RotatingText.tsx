"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// After scrolling stops, auto-cycling takes back over.
const STOP_DELAY = 700;
// Scrolling through this fraction of the viewport scrubs across every phrase.
const SCRUB_VH = 0.6;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Cycles through `phrases` in place with a per-word flipping-board motion. Idle,
 * it auto-advances at `interval` with a clean exit-then-enter. As the page
 * scrolls, scroll position scrubs the phrase (top of page → first, scrolled
 * down → last) with quicker, overlapping flips — a touch-friendly replacement
 * for the old pointer hover. Phrases wrap onto multiple lines on narrow screens;
 * a hidden sizer reserves the tallest phrase's height so the layout never jumps.
 */
export function RotatingText({
  phrases,
  interval = 3000,
  className = "",
}: {
  phrases: string[];
  interval?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [fast, setFast] = useState(false);
  const interactingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-cycle at regular speed — but stand down while scrolling is driving.
  useEffect(() => {
    if (reduce || phrases.length <= 1) return;
    const id = setInterval(() => {
      if (!interactingRef.current) {
        setFast(false);
        setIndex((i) => (i + 1) % phrases.length);
      }
    }, interval);
    return () => clearInterval(id);
  }, [reduce, phrases.length, interval]);

  // Scroll position selects the phrase (works on touch + desktop); when scroll
  // stops, control returns to the auto-cycle.
  useEffect(() => {
    if (reduce || phrases.length <= 1) return;
    const onScroll = () => {
      const range = window.innerHeight * SCRUB_VH;
      const p = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
      const i = Math.min(phrases.length - 1, Math.floor(p * phrases.length));
      interactingRef.current = true;
      setFast(true);
      setIndex(i);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => {
        interactingRef.current = false;
      }, STOP_DELAY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, [reduce, phrases.length]);

  if (!phrases || phrases.length === 0) return null;

  // Scrubbing flips fast with a tighter stagger; idle is slower and deliberate.
  const wordDuration = fast ? 0.28 : 0.5;
  const stagger = fast ? 0.03 : 0.06;

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger } },
    exit: { transition: { staggerChildren: stagger * 0.6 } },
  };

  const word = reduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        hidden: { opacity: 0, rotateX: -90, y: "0.35em" },
        visible: {
          opacity: 1,
          rotateX: 0,
          y: 0,
          transition: { duration: wordDuration, ease: EASE },
        },
        exit: {
          opacity: 0,
          rotateX: 90,
          y: "-0.35em",
          transition: { duration: wordDuration * 0.8, ease: EASE },
        },
      };

  return (
    <span
      className={`relative grid w-full overflow-hidden ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Hidden sizer: every phrase stacked so the box is as tall as the tallest
          one WRAPS at the current width. Lets phrases break onto 2–3 lines on
          narrow screens while keeping the height stable through the swap. */}
      {phrases.map((p, i) => (
        <span
          key={`sizer-${i}`}
          aria-hidden
          className="invisible col-start-1 row-start-1 block"
        >
          {p}
        </span>
      ))}

      {/* Animated layer overlays the sizer in the same grid cell. */}
      <span className="col-start-1 row-start-1 block">
        <AnimatePresence mode={fast ? undefined : "wait"}>
          <motion.span
            key={index}
            className="block"
            variants={container}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {phrases[index].split(" ").map((w, i) => (
              <Fragment key={i}>
                <motion.span
                  variants={word}
                  className="inline-block origin-bottom"
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {w}
                </motion.span>{" "}
              </Fragment>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
