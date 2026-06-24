"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// After scrolling stops, auto-cycling takes back over.
const STOP_DELAY = 700;
// Scrolling through this fraction of the viewport scrubs across every phrase.
const SCRUB_VH = 0.6;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Cycles through `phrases` in place with a per-word flipping-board motion. Every
 * phrase is grid-stacked into ONE cell, so they share an exact position and the
 * box is always as tall as the tallest phrase wraps — the layout stays
 * consistent and phrases break onto multiple lines on narrow screens. Only the
 * active phrase is visible; its words flip in one by one (staggered), the phrase
 * just left flips out, the rest wait hidden. Idle, it auto-advances at
 * `interval`; scroll position scrubs it (touch-friendly). The clip box is padded
 * (cancelled by equal negative margin) so flips and descenders never get cut.
 */
export function RotatingText({
  phrases,
  interval = 3000,
  className = "",
  onAdvance,
}: {
  phrases: string[];
  interval?: number;
  className?: string;
  onAdvance?: () => void;
}) {
  const reduce = useReducedMotion();
  // `prev` (the phrase just left) rides alongside `index` so the exit direction
  // is known even when scroll scrubbing jumps several phrases at once.
  const [{ index, prev }, setPhrase] = useState({ index: 0, prev: 0 });
  const [fast, setFast] = useState(false);
  // Large screens scrub by mouse X over the hero; small screens scrub by scroll.
  const [isLarge, setIsLarge] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const interactingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The scrub's last zone, so a scrub-driven word change nudges the gradient once.
  const lastZoneRef = useRef(-1);

  // Auto-cycle at regular speed — but stand down while scrolling is driving.
  useEffect(() => {
    if (reduce || phrases.length <= 1) return;
    const id = setInterval(() => {
      if (!interactingRef.current) {
        setFast(false);
        setPhrase((s) => ({
          index: (s.index + 1) % phrases.length,
          prev: s.index,
        }));
      }
    }, interval);
    return () => clearInterval(id);
  }, [reduce, phrases.length, interval]);

  // Track large vs small screen to pick the trigger.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // The phrase trigger. Large screens: the mouse's horizontal position over the
  // hero section picks the phrase (left → first, right → last). Small screens:
  // scroll position scrubs it (touch-friendly). When the input stops or leaves,
  // control returns to the auto-cycle.
  useEffect(() => {
    if (reduce || phrases.length <= 1) return;

    const select = (i: number) => {
      interactingRef.current = true;
      setFast(true);
      setPhrase((s) => (i === s.index ? s : { index: i, prev: s.index }));
      // A scrub-driven move to a new zone nudges the hero gradient forward.
      if (i !== lastZoneRef.current) {
        lastZoneRef.current = i;
        onAdvance?.();
      }
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => {
        interactingRef.current = false;
      }, STOP_DELAY);
    };
    const release = () => {
      interactingRef.current = false;
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };

    if (isLarge) {
      const section = rootRef.current?.closest("section");
      if (!section) return;
      const onMove = (e: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        const t = (e.clientX - rect.left) / rect.width;
        const i = Math.min(
          phrases.length - 1,
          Math.max(0, Math.floor(t * phrases.length)),
        );
        select(i);
      };
      section.addEventListener("mousemove", onMove);
      section.addEventListener("mouseleave", release);
      return () => {
        section.removeEventListener("mousemove", onMove);
        section.removeEventListener("mouseleave", release);
        if (stopTimer.current) clearTimeout(stopTimer.current);
      };
    }

    const onScroll = () => {
      const range = window.innerHeight * SCRUB_VH;
      const p = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
      const i = Math.min(phrases.length - 1, Math.floor(p * phrases.length));
      select(i);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, [reduce, phrases.length, isLarge, onAdvance]);

  if (!phrases || phrases.length === 0) return null;

  const wordDuration = fast ? 0.3 : 0.5;
  const stagger = fast ? 0.025 : 0.05;

  // Parent orchestrates the per-word stagger; only the visible transitions
  // (active / leaving) stagger, idle words snap straight to hidden.
  const container = {
    active: { transition: { staggerChildren: stagger } },
    leaving: { transition: { staggerChildren: stagger * 0.6 } },
    idle: { transition: { staggerChildren: 0 } },
  };

  const wordV = reduce
    ? {
        active: { opacity: 1, transition: { duration: 0 } },
        leaving: { opacity: 0, transition: { duration: 0 } },
        idle: { opacity: 0, transition: { duration: 0 } },
      }
    : {
        active: {
          opacity: 1,
          rotateX: 0,
          y: "0em",
          transition: { duration: wordDuration, ease: EASE },
        },
        leaving: {
          opacity: 0,
          rotateX: 90,
          y: "-0.35em",
          transition: { duration: wordDuration * 0.8, ease: EASE },
        },
        idle: { opacity: 0, rotateX: -90, y: "0.35em", transition: { duration: 0 } },
      };

  return (
    <span
      ref={rootRef}
      className={`relative grid w-full overflow-hidden ${className}`}
      // Padding gives flips + descenders room before the clip edge; the equal
      // negative margin cancels it so the heading's spacing doesn't move.
      style={{
        perspective: "1000px",
        paddingTop: "0.2em",
        paddingBottom: "0.4em",
        marginTop: "-0.2em",
        marginBottom: "-0.4em",
      }}
    >
      {phrases.map((phrase, i) => {
        const active = i === index;
        const leaving = i === prev && prev !== index;
        const state = active ? "active" : leaving ? "leaving" : "idle";
        const words = phrase.split(" ");
        return (
          <motion.span
            key={i}
            aria-hidden={!active}
            className="col-start-1 row-start-1 block"
            variants={container}
            initial={false}
            animate={state}
          >
            {words.map((w, wi) => (
              <Fragment key={wi}>
                <motion.span
                  variants={wordV}
                  className="inline-block origin-bottom"
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {w}
                </motion.span>
                {wi < words.length - 1 ? " " : ""}
              </Fragment>
            ))}
          </motion.span>
        );
      })}
    </span>
  );
}
