"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ProgressiveImage } from "../ProgressiveImage";
import { EASE_OUT, DURATION } from "@/lib/motion";

type Entrance = "bottom" | "top" | "left" | "right";

type FrameItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Edge the card travels in FROM: `bottom` rises, `left` slides rightward into
      place. Defaults to `bottom`, matching the page's fade-up language. */
  from?: Entrance;
};

/**
 * A set of screenshots presented together on a tinted panel — the MDX equivalent
 * of laying product shots side by side on a seamless. Each keeps its own file and
 * native aspect; nothing is baked into a composite.
 *
 * Sizing: `flex-grow` is set to each item's aspect ratio against `flex-basis: 0`,
 * so widths land proportional to aspect and every screenshot resolves to the SAME
 * height — tops and bottoms align even when the sources were cropped to slightly
 * different ratios. Below `sm` they stack full-width and the ratio is inert.
 *
 * Motion: the panel is the stage and stays put; the cards animate INTO it, in
 * order, so a multi-step flow plays as the sequence it depicts rather than
 * appearing all at once. Cards sit side by side, so they cross the viewport
 * threshold together and the stagger is a real beat, not a scroll artifact.
 * (Stacked on mobile, each simply animates as it arrives.) Only opacity and
 * transform animate, so nothing reflows.
 *
 * IMAGE-FRAME RULE (see ProgressiveImage): content images stay square and
 * borderless, and the panel obeys that — it is a flat, square-cornered block. The
 * radius here is on the INNER cards, which stand in for the depicted product's own
 * panel surface — the same license the SandboxEmbed device bezel takes. The corner
 * belongs to the UI in the picture, not to the picture frame.
 */

// Starting displacement per entrance edge; each card animates back to 0.
const OFFSET: Record<Entrance, { x?: number; y?: number }> = {
  bottom: { y: 24 },
  top: { y: -24 },
  left: { x: -24 },
  right: { x: 24 },
};

// Mirrors RevealBlock: settle just before the block is fully on-screen, once.
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

// Beat between cards. Deliberately longer than the header's line cascade
// (STAGGER, 0.15) so a sequence reads as "and then" rather than "at the same
// time". EASE_OUT is expo — most of a card's travel happens in the first ~0.5s,
// so the next one launches as the previous settles.
const BEAT = 0.45;

export function ImageFrame({
  items = [],
  caption,
}: {
  items?: FrameItem[];
  caption?: string;
}) {
  const reduce = useReducedMotion();
  if (!items.length) return null;

  return (
    <figure className="my-8">
      <div className="flex flex-col gap-6 bg-surface-subtle p-6 sm:flex-row sm:items-start sm:gap-10 sm:p-10">
        {items.map((item, i) => {
          const style = {
            "--frame-grow": String(item.width / item.height),
          } as CSSProperties;
          const className =
            "overflow-hidden rounded-xl shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.16)] sm:flex-[var(--frame-grow)_1_0%]";

          const image: ReactNode = (
            <ProgressiveImage
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes="(max-width: 640px) 100vw, 400px"
            />
          );

          // Reduced motion: the plain card, fully visible and in place.
          if (reduce) {
            return (
              <div key={item.src} style={style} className={className}>
                {image}
              </div>
            );
          }

          return (
            <motion.div
              key={item.src}
              style={style}
              className={className}
              initial={{ opacity: 0, ...OFFSET[item.from ?? "bottom"] }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: DURATION, ease: EASE_OUT, delay: i * BEAT }}
            >
              {image}
            </motion.div>
          );
        })}
      </div>
      {caption ? (
        <figcaption className="text-note mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
