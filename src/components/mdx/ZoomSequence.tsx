"use client";

/* eslint-disable @next/next/no-img-element -- layers are placed in board pixels inside a scaled world; next/image `fill` cannot, and the optimizer is off on deploy */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Box = { x: number; y: number; w: number; h: number };
type Layer = Box & {
  src: string;
  alt: string;
  /** The step this layer fades in at; it stays for the later steps. */
  from: number;
  /** Seconds after the step starts before it fades in. */
  delay?: number;
};
type Step = { label: string; frame: Box; hold: number };
type IntroImage = { src: string; alt: string; width: number; height: number };

// The camera move between steps (ms); matches the transform transition.
const MOVE = 950;
// The intro image: how long it holds, and its label in the step pill.
const INTRO_HOLD = 2000;
const INTRO_LABEL = "Interviews";

/**
 * One board of research, read as a camera move: each step frames part of the
 * board (raw notes, the same notes highlighted, the insights coded from them,
 * then every interview at once) and the layers for that step fade in over the
 * last. All positions are in the board's own pixels; the world is scaled to
 * fit each frame in the stage.
 *
 * It plays by itself while in view, looping. A timed pill in the corner shows
 * the step and fills over its time. A click pauses, and another plays again;
 * on hover a small line above the dots says which (the step label stays). Reduced motion: the last step, still.
 *
 * `intro` adds an intro step at the start of every loop: one image (the
 * interview calls) fades in over the empty board and fades out in place
 * before the first layer comes in. It never moves toward a part of the board,
 * so no face in it is tied to one interview's notes.
 */
export function ZoomSequence({
  board,
  layers = [],
  steps: given = [],
  intro,
  caption,
  background = "#ffffff",
}: {
  board: { width: number; height: number };
  layers?: Layer[];
  steps?: Step[];
  intro?: IntroImage;
  caption?: string;
  background?: string;
}) {
  const reduce = useReducedMotion();
  const fig = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // The intro holds on the first step's frame, so going on from it is a fade,
  // not a camera move. Every layer then comes in one step later.
  const hasIntro = Boolean(intro) && given.length > 0;
  const steps: Step[] = hasIntro ? [{ label: INTRO_LABEL, frame: given[0].frame, hold: INTRO_HOLD }, ...given] : given;
  const offset = hasIntro ? 1 : 0;
  const last = Math.max(0, steps.length - 1);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState(false);
  const [hover, setHover] = useState(false);
  // Bumped on every step change, to restart the pill's fill.
  const [run, setRun] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The first frame is placed without a move; later ones animate.
  const [ready, setReady] = useState(false);
  const shown = reduce ? last : step;
  const playing = !reduce && inView && !held && steps.length > 1;

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    const el = fig.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The first step holds for its own time; each later one also carries the
  // camera move into it.
  const duration = (steps[shown]?.hold ?? 0) + (shown === 0 && run === 0 ? 0 : MOVE);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      setStep((n) => (n >= last ? 0 : n + 1));
      setRun((n) => n + 1);
    }, duration);
    return () => clearTimeout(t);
  }, [playing, step, run, duration, last]);

  const frame = steps[shown]?.frame ?? { x: 0, y: 0, w: board.width, h: board.height };
  const k = size.w && size.h ? Math.min(size.w / frame.w, size.h / frame.h) : 0;
  const tx = (size.w - frame.w * k) / 2 - frame.x * k;
  const ty = (size.h - frame.h * k) / 2 - frame.y * k;
  const animate = ready && !reduce;
  // The intro image shows on the intro step while the figure is in view. Coming
  // back around the loop, it waits for the last step's layers to fade out first.
  const introOn = hasIntro && !reduce && ready && inView && shown === 0;
  const introWait = run > 0 ? 0.7 : 0.15;

  return (
    <figure ref={fig} className="my-8" aria-label={caption}>
      <style href="zoom-sequence" precedence="default">{`@keyframes zs-fill { from { width: 0 } to { width: 100% } }`}</style>
      <div
        ref={stage}
        className="relative aspect-[16/10] cursor-pointer overflow-hidden"
        style={{ background }}
        onClick={() => setHeld((h) => !h)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            width: board.width,
            height: board.height,
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
            transition: animate ? `transform ${MOVE}ms cubic-bezier(0.65, 0, 0.35, 1)` : "none",
            visibility: k ? "visible" : "hidden",
          }}
        >
          {layers.map((l) => {
            const from = l.from + offset;
            // The first layer after the intro waits for the intro image to leave.
            const wait = (l.delay ?? 0) + (hasIntro && from === 1 ? 0.45 : 0);
            return (
              <img
                key={l.src}
                src={l.src}
                alt={l.alt}
                decoding="async"
                draggable={false}
                className="absolute block max-w-none select-none"
                style={{
                  left: l.x,
                  top: l.y,
                  width: l.w,
                  height: l.h,
                  opacity: shown >= from ? 1 : 0,
                  transitionProperty: "opacity",
                  transitionDuration: animate ? "0.9s" : "0s",
                  transitionTimingFunction: "ease",
                  transitionDelay: animate && shown >= from && wait ? `${wait}s` : "0s",
                }}
              />
            );
          })}
        </div>

        {/* The intro: one image over the empty board, faded in and out in place.
            The bottom inset keeps it clear of the step pill. */}
        {hasIntro && intro ? (
          <div className="pointer-events-none absolute inset-x-[6%] top-[6%] bottom-[16%] flex items-center justify-center">
            <img
              src={intro.src}
              alt={intro.alt}
              width={intro.width}
              height={intro.height}
              decoding="async"
              draggable={false}
              className="block h-full w-full object-contain select-none"
              style={{
                opacity: introOn ? 1 : 0,
                transitionProperty: "opacity",
                transitionDuration: introOn ? "0.7s" : "0.4s",
                transitionTimingFunction: "ease",
                transitionDelay: introOn ? `${introWait}s` : "0s",
              }}
            />
          </div>
        ) : null}

        {/* The step: a dot each, the current one a pill filling over its time,
            over the step's name. The stage is always light, so the colours are
            fixed rather than themed. */}
        {steps.length > 1 ? (
          <div className="absolute bottom-3.5 left-4 flex flex-col gap-1.5">
            {/* The pause hint: its own quieter line above the dots, so the
                step label is never replaced. */}
            <p
              aria-hidden
              className="text-[10px] leading-tight font-medium whitespace-nowrap text-[#6f6f6f] transition-opacity duration-[250ms]"
              style={{ opacity: hover && !reduce ? 1 : 0 }}
            >
              {held ? "Click to play" : "Click to pause"}
            </p>
            <div className="flex w-full gap-1" aria-hidden>
              {steps.map((s, n) => (
                <span
                  key={s.label}
                  className="relative h-2 shrink-0 basis-2 overflow-hidden rounded-full bg-[#d9d9d9] transition-[flex-grow] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ flexGrow: n === shown ? 1 : 0 }}
                >
                  {n === shown && !reduce ? (
                    <i
                      key={run}
                      className="absolute inset-y-0 left-0 rounded-full bg-[#1e1e1e]"
                      style={{
                        width: 0,
                        animationName: "zs-fill",
                        animationDuration: `${duration}ms`,
                        animationTimingFunction: "linear",
                        animationFillMode: "forwards",
                        animationPlayState: playing ? "running" : "paused",
                      }}
                    />
                  ) : null}
                </span>
              ))}
            </div>
            {/* Every label in one grid cell, so the block is as wide as the
                longest and the pill's row matches it. */}
            <p className="grid text-[12px] leading-tight font-semibold tracking-[-0.01em] whitespace-nowrap text-[#1e1e1e]" aria-live="polite">
              {steps.map((s, n) => (
                <span
                  key={s.label}
                  className="[grid-area:1/1] transition-opacity duration-[250ms]"
                  style={{ opacity: n === shown ? 1 : 0 }}
                >
                  {n + 1}. {s.label}
                </span>
              ))}
            </p>
          </div>
        ) : null}
      </div>
      {caption ? <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption> : null}
    </figure>
  );
}
