"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "iconoir-react";
import { HeroImageStack, type HeroStackItem } from "./HeroImageStack";
import { Highlighter } from "./Highlighter";
import { Link } from "@/i18n/navigation";
import { EASE_OUT } from "@/lib/motion";
import { HL_COLOR } from "@/lib/highlight";

// Reveal cadence: one header line every STEP ms, then the sub text and the CTA
// buttons each follow after LEDE_DELAY. Plays ONCE per viewport visit (no loop);
// replays when the hero leaves and re-enters. Keep the line tween duration
// (0.55s, below) STRICTLY < STEP so each line settles before the next steps in.
const STEP = 600;
const LEDE_DELAY = 600;

// The headline, revealed one line at a time (step by step). Line index 1 is
// rendered specially below (it carries the "end-to-end" circle + "product
// designer" highlight); the string here is kept for the reveal step count.
const HEADLINE = [
  "Daechan Kim,",
  "a proven end-to-end product designer",
  "for fast-moving, mission-driven teams.",
];

// Hand-drawn ellipse (viewBox 0 0 340 175): a single open loop with a tail at the
// top-right, echoing a marker scribble. pathLength=1 lets dashoffset draw it in.
const CIRCLE_PATH =
  "M185 30 C110 12 40 34 30 84 C18 132 96 158 180 157 C264 156 325 128 320 82 C316 45 250 27 178 27 C205 27 240 24 300 21";

// Thin the highlighter band (negative vertical padding) so it reads closer to the
// circle's line weight and stops bleeding into the neighbouring line.
const HL_PAD: [number, number] = [-4, 3];

/**
 * A word/phrase wrapped in the hand-drawn marker circle. The circle is a CSS-
 * positioned SVG (see `.hl-circle` in globals.css) that draws in via
 * stroke-dashoffset when `active`, sits behind the text (z-index), and scales in
 * `em` so it fits whatever it wraps.
 */
function MarkCircle({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}) {
  return (
    <span className="relative inline-block">
      {children}
      <svg
        className={`hl-circle${active ? " hl-circle-on" : ""}`}
        viewBox="0 0 340 175"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={CIRCLE_PATH} pathLength={1} stroke={HL_COLOR} />
      </svg>
    </span>
  );
}

/**
 * Hero headline. The header lines reveal one at a time (step by step), then the
 * sub text and finally the two CTA buttons ride in. Once everything has settled,
 * a single yellow annotation pass draws four marks in sequence: a circle on
 * "end-to-end" and a Highlighter over "product designer" (headline), then a
 * circle on "3+" and a Highlighter over "B2B2C startup and global client work"
 * (sub text). In sync with the text, an image flies into the right-hand stack on
 * each reveal (3 lines + sub text = 4 cards). The sequence plays ONCE per
 * viewport visit (IntersectionObserver replays on re-entry; plays on mount so it
 * never waits on the observer); it never loops. Reduced motion → everything
 * static.
 */
export function HeroHeadline({ stack }: { stack: HeroStackItem[] }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  // Reveal steps: one per header line, then the sub text, then the buttons.
  const total = HEADLINE.length + 2;
  const [entered, setEntered] = useState(false);
  const [count, setCount] = useState(0);
  // How many of the four annotation marks have drawn in (0..4).
  const [markStep, setMarkStep] = useState(0);

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

  // Draw the four marks only after the sub text has settled (rough-notation
  // measures the final box). Staggered in reading order; reduced motion draws
  // all at once. Cleared when the hero resets / leaves view.
  useEffect(() => {
    if (!ledeShown) {
      setMarkStep(0);
      return;
    }
    if (reduce) {
      setMarkStep(4);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const base = 550; // let the sub-text fade settle before measuring
    const step = 320;
    [1, 2, 3, 4].forEach((n, i) => {
      timers.push(setTimeout(() => setMarkStep(n), base + i * step));
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
        <h1 className="text-display relative hl-behind">
          {/* Header — lines step in one at a time at counts 1..N. Line 1 carries
              the "end-to-end" circle and the "product designer" highlight.
              Opacity-only (no y-transform): the highlighter (rough-notation)
              measures and anchors its SVG to the line, so a transform on the line
              would throw the mark off-position. */}
          {HEADLINE.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              initial={false}
              animate={{ opacity: i < count ? 1 : 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              {i === 1 ? (
                <>
                  a proven{" "}
                  <Highlighter
                    action="highlight"
                    color={HL_COLOR}
                    active={markStep > 0}
                    animationDuration={hlDuration}
                    padding={HL_PAD}
                  >
                    end-to-end
                  </Highlighter>{" "}
                  product designer
                </>
              ) : (
                line
              )}
            </motion.span>
          ))}
        </h1>

        {/* Sub text — fades in a beat after the last header line, then its marks
            draw. Opacity-only (no y-transform) and position:relative on purpose:
            the highlighter (rough-notation) measures each phrase's box and anchors
            its SVG here, so the phrases must never move under it. */}
        <motion.div
          className="relative mt-8 hl-behind max-w-[42rem]"
          initial={false}
          animate={{ opacity: ledeShown ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <p className="text-sub-display text-fg-muted">
            I&apos;m a designer, researcher, and builder with{" "}
            <MarkCircle active={markStep > 1}>3+</MarkCircle> years experience
            across a{" "}
            <Highlighter
              action="highlight"
              color={HL_COLOR}
              active={markStep > 2}
              animationDuration={hlDuration}
              padding={HL_PAD}
            >
              B2B2C startup
            </Highlighter>{" "}
            and{" "}
            <Highlighter
              action="highlight"
              color={HL_COLOR}
              active={markStep > 3}
              animationDuration={hlDuration}
              padding={HL_PAD}
            >
              global client work
            </Highlighter>
            .
          </p>
          <p className="text-sub-display mt-4 text-fg-muted">
            I&apos;d love to talk about opportunities where I get to research,
            design, make to expand my horizon.
          </p>
        </motion.div>

        {/* CTA buttons — the final step, after the sub text. */}
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-6"
          initial={false}
          animate={{ opacity: buttonsShown ? 1 : 0, y: buttonsShown ? 0 : 16 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          inert={!buttonsShown}
        >
          <Link href="/project" className="link-button hairline-b">
            <span>Work</span>
            <ArrowRight aria-hidden />
          </Link>
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
