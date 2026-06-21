"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// How long the mouse must be still before auto-cycling takes back over.
const STOP_DELAY = 700;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Cycles through `phrases` in place. Each phrase flips in word by word with a
 * slight stagger (a per-word flipping board). Idle, it auto-advances at
 * `interval` with a clean exit-then-enter; while the mouse moves over the hero
 * section the pointer's vertical position scrubs the phrase (top → first,
 * bottom → last) with quicker, overlapping flips. The per-word flip is the same
 * in both states — only the speed changes.
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
  const rootRef = useRef<HTMLSpanElement>(null);
  const interactingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-cycle at regular speed — but stand down while the mouse is driving.
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

  // Mouse position over the hero <section> selects the phrase; stopping or
  // leaving hands control back to the auto-cycle.
  useEffect(() => {
    if (reduce || phrases.length <= 1) return;
    const section = rootRef.current?.closest("section");
    if (!section) return;

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const t = (e.clientY - rect.top) / rect.height;
      const i = Math.min(
        phrases.length - 1,
        Math.max(0, Math.floor(t * phrases.length)),
      );
      interactingRef.current = true;
      setFast(true);
      setIndex(i);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => {
        interactingRef.current = false;
      }, STOP_DELAY);
    };
    const onLeave = () => {
      interactingRef.current = false;
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, [reduce, phrases.length]);

  if (!phrases || phrases.length === 0) return null;

  // Hover flips fast with a tighter stagger; idle is slower and more deliberate.
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
      ref={rootRef}
      className={`relative inline-grid justify-center overflow-hidden w-full ${className}`}
      style={{
        height: "1.25em",
        lineHeight: "1.25em",
        perspective: "1000px",
        verticalAlign: "bottom",
      }}
    >
      {/* Idle uses `wait` for a clean exit-then-enter; hover overlaps so it
          stays responsive while scrubbing. */}
      <AnimatePresence mode={fast ? undefined : "wait"}>
        <motion.span
          key={index}
          className="col-start-1 row-start-1 block whitespace-nowrap"
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
  );
}
