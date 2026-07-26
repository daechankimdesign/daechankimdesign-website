"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { type HeroStackItem } from "./HeroImageStack";
import { HeroCoverFlow } from "./HeroCoverFlow";
import { Highlighter } from "./Highlighter";
import { LinkButton } from "./LinkButton";
import { LoveLetterButton } from "./LoveLetter";
import { EASE_OUT } from "@/lib/motion";
import { HL_COLOR } from "@/lib/highlight";
import { RESUME_URL } from "@/lib/links";
import { useResume } from "./ResumeModal";

// Reveal cadence: one header line every STEP ms, then the sub text and the CTA
// buttons each follow after LEDE_DELAY. Plays ONCE per viewport visit (no loop);
// replays when the hero leaves and re-enters. Keep the line tween duration
// (0.55s, below) STRICTLY < STEP so each line settles before the next steps in.
const STEP = 600;
const LEDE_DELAY = 600;

// The deck runs its OWN even cadence: each photo holds DECK_DWELL ms then advances,
// so all four get a similar on-screen time. Decoupled from the exact text lines (the
// 5 uneven beats can't give 4 photos an equal dwell), but the deck still appears
// with the hero and plays once — it's not a separate looping animation. Tunable.
const DECK_DWELL = 900;

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
  const resume = useResume();
  const containerRef = useRef<HTMLDivElement>(null);
  // Reveal steps: one per header line, then the sub text, then the buttons.
  const total = HEADLINE.length + 2;
  const [count, setCount] = useState(0);
  // How many of the four annotation marks have drawn in (0..4).
  const [markStep, setMarkStep] = useState(0);
  // The deck advances its own photo every DECK_DWELL (see the effect below), so the
  // four photos share a similar dwell instead of riding the uneven text beats.
  const [deckStep, setDeckStep] = useState(0);

  useEffect(() => {
    if (reduce) {
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
      setCount(1);
      t = setTimeout(build, STEP);
    };
    const reset = () => {
      clearTimeout(t);
      n = 0;
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
  // The cover-flow deck appears WITH the first header line ("Daechan Kim,"): photo
  // 1 sweeps in from the side as it fades in — ONE motion, no unfocused hold, so no
  // gap before the first focus (see HeroCoverFlow / CoverFlow `entranceOffset`).
  const deckShown = count > 0;
  // Which photo the deck centers — driven by the deck's OWN even timer (deckStep),
  // not the text counter, so every photo gets a similar on-screen dwell instead of
  // one lingering or flashing by (the text beats are uneven / one short of the
  // photos, which is what distorted the durations).
  const focus = deckStep;

  // Deck cadence: once the deck is shown (with line 1), step through the photos one
  // DECK_DWELL apart, then rest on the last. The deck still appears WITH the hero
  // and plays once — only the per-photo advance is on this even timer, not the exact
  // text lines. Reset when the hero leaves so a re-entry replays it; reduced motion
  // just rests on photo 1.
  useEffect(() => {
    if (!deckShown || reduce) {
      setDeckStep(0);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < stack.length; i++) {
      timers.push(setTimeout(() => setDeckStep(i), i * DECK_DWELL));
    }
    return () => timers.forEach(clearTimeout);
  }, [deckShown, reduce, stack.length]);

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
      className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-16"
    >
      <div className="flex flex-1 flex-col items-start min-w-0">
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
          className="relative mt-8 hl-behind max-w-[40rem]"
          initial={false}
          animate={{ opacity: ledeShown ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <p className="text-sub-display text-fg-muted dark:text-fg">
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
          <p className="text-sub-display mt-4 text-fg-muted dark:text-fg">
            I&apos;d love to talk about opportunities where I can grow and
            contribute to connecting humanity with AI to improve our daily
            experiences.
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
          {/* Hovering this raises the page-wide envelope stage (see
              EnvelopeStage); clicking it continues the intro and opens the letter. */}
          <LoveLetterButton arrow="right" />
          {/* Resume lives on Firebase Storage (media/about/), not public/ —
              App Hosting serves no public/ paths. See docs/MEDIA-PIPELINE.md.
              Stays a real <a href> to the PDF so modifier / middle click and a
              no-JS visit still reach the file; a plain click opens the viewer
              modal instead (same as the nav pill's Resume). */}
          <LinkButton
            href={RESUME_URL}
            external
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              resume?.open("hero");
            }}
          >
            Resume
          </LinkButton>
        </motion.div>
      </div>

      {/* Right — image deck. Fades in with the first header line (resting on the
          primary photo), then flips through each photo once after the text
          settles (see HeroCoverFlow). Clicking the centered card opens the
          lightbox. */}
      <HeroCoverFlow
        items={stack}
        show={deckShown}
        focus={focus}
        reduce={!!reduce}
      />
    </div>
  );
}
