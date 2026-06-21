"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Cycles through `phrases` in place. The phrases are grid-stacked into one cell
 * so the box is always as tall as the tallest phrase — rotating never reflows
 * the content below. Respects prefers-reduced-motion (holds the first phrase).
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

  useEffect(() => {
    if (reduce || phrases.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % phrases.length),
      interval,
    );
    return () => clearInterval(id);
  }, [reduce, phrases.length, interval]);

  // Forward-only cycle, so the phrase leaving is always the previous index.
  // Active sits at rest; the one exiting slides up and out; everything else
  // waits below, ready to slide up into place.
  const prev = (index - 1 + phrases.length) % phrases.length;

  return (
    <span className={`grid ${className}`}>
      {phrases.map((phrase, i) => (
        <motion.span
          key={i}
          aria-hidden={i !== index ? true : undefined}
          className="col-start-1 row-start-1"
          initial={false}
          animate={
            i === index
              ? { opacity: 1, y: 0 }
              : i === prev
                ? { opacity: 0, y: "-0.6em" }
                : { opacity: 0, y: "0.6em" }
          }
          transition={
            reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {phrase}
        </motion.span>
      ))}
    </span>
  );
}
