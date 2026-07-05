"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "iconoir-react";

const EASE = [0.22, 1, 0.36, 1] as const;

// Reveal cadence: a clause every STEP ms (brisk — matches the lede beat); the
// lede then the CTA buttons each follow after LEDE_DELAY. Plays ONCE per viewport
// visit (no loop); replays when the hero leaves and re-enters.
const STEP = 600;
const LEDE_DELAY = 600;

// The three parts of "end-to-end" — one per clause (3 of each). Each brightens
// from 5% → 100% as its matching clause lands.
const HYPHEN_PARTS = ["end", "-to-", "end"];

function scrollToWork() {
  document
    .getElementById("work")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero headline. The subject line fades in, then the clauses STACK downward —
 * one every STEP ms, each lighting its "end-to-end" part 5% → 100% — then the
 * lede and finally the two CTA buttons ride in at the bottom. The whole sequence
 * plays ONCE per viewport visit (IntersectionObserver replays it on re-entry, and
 * it plays on mount so it never depends solely on the observer); it never loops.
 * Every line stays in flow (opacity/transform only) so nothing below shifts.
 * Reduced-motion → everything static.
 */
export function HeroHeadline({
  phrases,
  lede,
}: {
  phrases: string[];
  lede: string;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  // Reveal steps: one per clause, then the lede, then the buttons.
  const total = phrases.length + 2;
  const [entered, setEntered] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) {
      setEntered(true);
      setCount(total);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const build = () => {
      n += 1;
      setCount(n);
      if (n < total) {
        const nextIsClause = n + 1 <= phrases.length;
        t = setTimeout(build, nextIsClause ? STEP : LEDE_DELAY);
      }
      // n === total → sequence complete; stop (no loop).
    };
    const play = () => {
      clearTimeout(t);
      n = 0;
      setEntered(true);
      setCount(0);
      t = setTimeout(build, STEP);
    };
    const reset = () => {
      clearTimeout(t);
      n = 0;
      setEntered(false);
      setCount(0);
    };

    // Play on mount, so the hero never stays blank waiting on the observer.
    play();

    // The observer only handles LEAVING (reset) and RE-ENTERING (replay).
    let visible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!visible) {
            visible = true;
            play();
          }
        } else if (visible) {
          visible = false;
          reset();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, [reduce, total]);

  const ledeShown = count > phrases.length;
  const buttonsShown = count > phrases.length + 1;

  return (
    <div ref={containerRef} className="flex w-full flex-col items-start">
      <h1 className="text-display">
        {/* Subject line — fades in on entry; "end-to-end" parts light with the stack. */}
        <motion.span
          className="block"
          initial={false}
          animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 20 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="block">Daechan Kim,</span>
          <span className="block">
            a proven{" "}
            <span className="whitespace-nowrap">
              {HYPHEN_PARTS.map((part, i) => (
                <motion.span
                  key={i}
                  initial={false}
                  animate={{ opacity: i < count ? 1 : 0.05 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {part}
                </motion.span>
              ))}
            </span>{" "}
            product designer,
          </span>
        </motion.span>

        {/* Stacking clauses — reveal at counts 1..N. */}
        {phrases.map((line, i) => (
          <motion.span
            key={i}
            className="block"
            initial={false}
            animate={{ opacity: i < count ? 1 : 0, y: i < count ? 0 : 16 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {line}
          </motion.span>
        ))}
      </h1>

      {/* Lede — rides in a beat after the last clause. */}
      <motion.p
        className="text-sub-display measure-lede mt-8 text-fg-muted"
        initial={false}
        animate={{ opacity: ledeShown ? 1 : 0, y: ledeShown ? 0 : 16 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {lede}
      </motion.p>

      {/* CTA buttons — the final step, after the lede. */}
      <motion.div
        className="mt-8 flex flex-wrap items-center gap-6"
        initial={false}
        animate={{ opacity: buttonsShown ? 1 : 0, y: buttonsShown ? 0 : 16 }}
        transition={{ duration: 0.5, ease: EASE }}
        inert={!buttonsShown}
      >
        <button
          type="button"
          onClick={scrollToWork}
          className="link-button hairline-b"
        >
          <span>Work</span>
          <ArrowDown aria-hidden />
        </button>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="link-button hairline-b"
        >
          <span>Resume</span>
          <ArrowUpRight aria-hidden />
        </a>
      </motion.div>
    </div>
  );
}
