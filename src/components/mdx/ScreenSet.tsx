"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ProgressiveImage } from "../ProgressiveImage";
import { EASE_OUT, DURATION } from "@/lib/motion";

type Shot = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** The export already draws its own card (border, shadow, rounded corners):
   *  show it as is, without the white card around it. */
  bare?: boolean;
  /** A callout above the component: what it is, in a few words. */
  label?: string;
};

// Same reveal timing as ImageFrame: settle just before fully on-screen, once,
// with a beat between pieces long enough to read as "and then".
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;
const BEAT = 0.3;
// The phone leads: the components start only once it is mostly in place.
const PHONE_LEAD = 0.6;
// A phone screen is shown at most this tall, so a mockup never takes a whole
// viewport; its components carry the detail beside it.
const PHONE_MAX_H = 440;

// Component cards: flat, rounded, softly shadowed, like ImageFrame's cards, on
// white: the components are transparent exports with dark text, so they need
// the light surface they sit on in the app (otherwise they vanish in dark mode).
// Phone screens stay transparent: the device frame carries them.
const CARD =
  "overflow-hidden rounded-xl bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.16)]";

/**
 * A phone screen with the smaller interface components that explain it, on one
 * panel. The phone is held to a modest height and the components sit beside it
 * (at every width, phones included), each at no more than its exported size, so the set
 * stays balanced instead of one mockup filling the screen. On scroll-in the
 * phone rises first, then each component slides in from the phone's side, one
 * after another.
 *
 * Without a `screen`, the components play as a centred sequence (a conversation
 * or a flow), each arriving after the last.
 */
export function ScreenSet({
  screen,
  items = [],
  caption,
}: {
  screen?: Shot;
  items?: Shot[];
  caption?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const shown = reduce || inView;

  const enter = (i: number, from: "up" | "side") =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, ...(from === "up" ? { y: 24 } : { x: 24 }) },
          animate: shown ? { opacity: 1, x: 0, y: 0 } : undefined,
          transition: { duration: DURATION, ease: EASE_OUT, delay: i === 0 ? 0 : PHONE_LEAD + (i - 1) * BEAT },
        };

  const card = (item: Shot, i: number) => (
    <motion.div
      key={item.src}
      className="w-full"
      style={{ maxWidth: item.width }}
      {...enter(screen ? i + 1 : i, screen ? "side" : "up")}
    >
      {item.label ? (
        <span className="text-note mb-1.5 block font-medium text-fg-muted">{item.label}</span>
      ) : null}
      <div className={item.bare ? "" : CARD}>
        <ProgressiveImage src={item.src} alt={item.alt} width={item.width} height={item.height} sizes="240px" />
      </div>
    </motion.div>
  );

  return (
    <figure ref={ref} className="my-8">
      <div className="bg-surface-panel p-4 sm:p-10">
        {screen ? (
          <div
            className="flex flex-row items-center justify-center gap-4 sm:gap-10"
          >
            <motion.div
              className="shrink-0 drop-shadow-[0_18px_28px_rgba(0,0,0,0.18)]"
              // Side by side at every width. The phone keeps most of the row on phones
              // (55%); the components take what is left, capped at 170px.
              style={{ width: `min(55%, ${Math.round((PHONE_MAX_H * screen.width) / screen.height)}px)` }}
              {...enter(0, "up")}
            >
              <ProgressiveImage
                src={screen.src}
                alt={screen.alt}
                width={screen.width}
                height={screen.height}
                sizes="220px"
              />
            </motion.div>
            {items.length ? (
              <div className="flex min-w-0 max-w-[170px] flex-1 flex-col items-stretch gap-3">
                {items.map(card)}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto flex max-w-[300px] flex-col items-center gap-4">{items.map(card)}</div>
        )}
      </div>
      {caption ? <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption> : null}
    </figure>
  );
}
