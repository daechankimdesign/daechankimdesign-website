"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ProgressiveImage } from "../ProgressiveImage";

/**
 * An image that starts close in on one point (a phone's screen) and zooms out
 * to the whole picture as the page scrolls: fully in at the top of the page,
 * fully out once the figure's middle reaches the middle of the viewport. The
 * zoom is tied to the scroll position, so it reverses on the way back up,
 * and it follows on a spring, a beat behind the scroll.
 * Reduced motion: the whole picture, still.
 */
export function ScrollZoomImage({
  src,
  alt,
  width,
  height,
  caption,
  background,
  flushBottom = false,
  scale = 1.8,
  focus = "50% 40%",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  background?: string;
  flushBottom?: boolean;
  /** How close it starts (1 = no zoom). */
  scale?: number;
  /** The point it zooms out from, as a CSS transform origin. */
  focus?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // The scroll position at which the zoom ends: the figure's middle at the
  // viewport's middle (never before a little scrolling has happened).
  const [end, setEnd] = useState(600);
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setEnd(Math.max(300, r.top + window.scrollY + r.height / 2 - window.innerHeight / 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const { scrollY } = useScroll();
  const target = useTransform(scrollY, [0, end], [scale, 1], { clamp: true });
  // The zoom trails the scroll a little and settles, so it eases instead of
  // ticking with each wheel step. Only the scale lags; the image stays put.
  const s = useSpring(target, { stiffness: 90, damping: 22, mass: 0.6 });

  return (
    <figure className="my-8">
      <div
        ref={ref}
        className={`overflow-hidden ${background ? (flushBottom ? "px-5 pt-5 sm:px-10 sm:pt-10" : "p-5 sm:p-10") : ""}`}
        style={background ? { background } : undefined}
      >
        <motion.div style={reduce ? undefined : { scale: s, transformOrigin: focus }}>
          <ProgressiveImage src={src} alt={alt} width={width} height={height} sizes="(max-width: 768px) 100vw, 800px" priority />
        </motion.div>
      </div>
      {caption ? <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption> : null}
    </figure>
  );
}
