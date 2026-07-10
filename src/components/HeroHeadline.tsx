"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "iconoir-react";
import { HeroImageStack, type HeroStackItem } from "./HeroImageStack";
import { Highlighter } from "./Highlighter";
import { EASE_OUT } from "@/lib/motion";

// Reveal cadence: one header line every STEP ms, then the sub text and the CTA
// buttons each follow after LEDE_DELAY. Plays ONCE per viewport visit (no loop);
// replays when the hero leaves and re-enters. Keep the line tween duration
// (0.55s, below) STRICTLY < STEP so each line settles before the next steps in.
const STEP = 600;
const LEDE_DELAY = 600;

// The headline, revealed one line at a time (step by step).
const HEADLINE = [
  "Daechan Kim,",
  "a proven end-to-end product designer",
  "for fast-building teams.",
];

// Magic UI Highlighter marker colour for the three sub-text action phrases. The
// alpha lives here (not as a flat SVG opacity) so rough-notation's overlapping
// strokes compound to a denser, hand-drawn marker where they cross.
const HL_COLOR = "rgba(253, 231, 105, 0.55)";

function scrollToWork() {
  document
    .getElementById("work")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero headline. The header lines reveal one at a time (step by step), then the
 * sub text and finally the two CTA buttons ride in. Once the sub text has
 * settled, a Magic UI Highlighter (rough-notation) draws a marker over its three
 * action phrases, staggered left to right. In sync with the text, an image flies
 * into the right-hand stack on each reveal (3 lines + sub text = 4 cards). The
 * sequence plays ONCE per viewport visit (IntersectionObserver replays on
 * re-entry; plays on mount so it never waits on the observer); it never loops.
 * Reduced motion → everything static.
 */
export function HeroHeadline({ stack }: { stack: HeroStackItem[] }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  // Reveal steps: one per header line, then the sub text, then the buttons.
  const total = HEADLINE.length + 2;
  const [entered, setEntered] = useState(false);
  const [count, setCount] = useState(0);
  // How many of the three sub-text phrases have their highlighter drawn.
  const [hlActive, setHlActive] = useState(0);

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
        const nextIsLine = n + 1 <= HEADLINE.length;
        t = setTimeout(build, nextIsLine ? STEP : LEDE_DELAY);
      }
      // n === total → sequence complete; stop (no loop).
    };
    const play = () => {
      clearTimeout(t);
      // First line shows immediately so the hero never starts blank; the rest
      // step in on the timer.
      n = 1;
      setEntered(true);
      setCount(1);
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

  const ledeShown = count > HEADLINE.length;
  const buttonsShown = count > HEADLINE.length + 1;
  // One image reveals per header line + one for the sub text (== stack.length).
  const cardsRevealed = Math.min(count, stack.length);

  // Draw the highlighters only after the sub text has faded in and settled
  // (rough-notation measures the final box). Staggered left to right; reduced
  // motion draws all three at once. Cleared when the hero resets/leaves view.
  useEffect(() => {
    if (!ledeShown) {
      setHlActive(0);
      return;
    }
    if (reduce) {
      setHlActive(3);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const base = 750; // wait out the 0.7s sub-text fade before measuring
    const step = 280;
    [1, 2, 3].forEach((phrase, i) => {
      timers.push(setTimeout(() => setHlActive(phrase), base + i * step));
    });
    return () => timers.forEach(clearTimeout);
  }, [ledeShown, reduce]);

  const hlDuration = reduce ? 0 : 700;

  return (
    <div
      ref={containerRef}
      className="flex w-full flex-col gap-12 lg:flex-row lg:items-center lg:gap-16"
    >
      <div className="flex flex-1 flex-col items-start">
        <h1 className="text-display">
          {/* Header — lines step in one at a time at counts 1..N. */}
          {HEADLINE.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              initial={false}
              animate={{ opacity: i < count ? 1 : 0, y: i < count ? 0 : 16 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        {/* Sub text — fades in a beat after the last header line; the three
            action phrases get a staggered Magic UI Highlighter once it's in.
            Opacity-only (no y-transform) and position:relative on purpose: the
            highlighter (rough-notation) measures each phrase's box and anchors
            its SVG to this paragraph, so the phrases must never move under it. */}
        <motion.p
          className="text-sub-display measure-lede relative mt-8 text-fg-muted"
          initial={false}
          animate={{ opacity: ledeShown ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          I&apos;m a designer, researcher, and builder, always looking to expand
          my horizons and learn new things. With 3+ years across a B2B2C startup
          and global client work, I&apos;d love to talk about opportunities where
          I get to{" "}
          <Highlighter
            action="highlight"
            color={HL_COLOR}
            active={hlActive > 0}
            animationDuration={hlDuration}
          >
            listen to people
          </Highlighter>
          ,{" "}
          <Highlighter
            action="highlight"
            color={HL_COLOR}
            active={hlActive > 1}
            animationDuration={hlDuration}
          >
            obsess over a detail all night
          </Highlighter>
          , and{" "}
          <Highlighter
            action="highlight"
            color={HL_COLOR}
            active={hlActive > 2}
            animationDuration={hlDuration}
          >
            get it into their hands
          </Highlighter>
          .
        </motion.p>

        {/* CTA buttons — the final step, after the sub text. */}
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-6"
          initial={false}
          animate={{ opacity: buttonsShown ? 1 : 0, y: buttonsShown ? 0 : 16 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
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

      {/* Right — image stack; a card flies in on each text reveal. */}
      <HeroImageStack items={stack} revealed={cardsRevealed} reduce={!!reduce} />
    </div>
  );
}
