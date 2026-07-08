"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { HeroGallery } from "./HeroGallery";

// `src` is the 480px card image (quick load); `full` is the full-res lightbox
// image. Either may be "" (renders a placeholder card / lightbox slide). `w`/`h`
// are the image's natural pixel dims — the card takes that ratio (no crop); when
// absent it falls back to the portrait frame.
export type HeroStackItem = {
  src: string;
  full: string;
  caption: string;
  w?: number;
  h?: number;
};

// Fly-in START rotation — each card enters clearly tilted, then settles to its
// resting scatter angle as it rises (so the fly-in reads as a rotate + lift).
const FLY_TILT = [-18, 16, -15, 18];
// Resting scatter — a light pile (per-card, deterministic so it's SSR-safe).
const REST_TILT = [-6, 4, -3, 7];
const REST_X = [0, 8, -7, 6];
// Hover fan-out — a SLIGHT spread. Kept small (translate + rotation stay within
// the ~64px column gap on the left and ~60px page gutter on the right) so a
// fanned card never bleeds over the hero text or off the viewport edge.
const FAN_TILT = [-3, -1, 1, 3];
const FAN_X = [-20, -7, 7, 20];
const FAN_Y = [3, -2, -2, 3];

/**
 * The hero image stack. A card flies up (About-style) into an overlapping pile
 * each time `revealed` advances — one per hero text reveal. Once all cards are
 * in, hovering fans the pile out; clicking any card opens the gallery lightbox
 * (with its supplementary caption). Only opacity/transform animate, and the
 * frame is a fixed size, so it never shifts the hero layout. Reduced-motion →
 * the full pile renders static.
 */
export function HeroImageStack({
  items,
  revealed,
  reduce,
}: {
  items: HeroStackItem[];
  revealed: number;
  reduce: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const complete = revealed >= items.length;
  const fan = complete && hovered && !reduce;

  return (
    <>
      <div
        className="relative aspect-[3/4] w-[240px] shrink-0 self-center sm:w-[300px] lg:w-[340px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {items.map((item, i) => {
          const shown = reduce ? true : i < revealed;
          // Card takes the photo's own ratio (landscape/square/portrait, no
          // crop); the placeholder falls back to the portrait frame. A static,
          // pointer-transparent centering layer holds each card so framer owns
          // the card's transform cleanly and only the card rect is interactive.
          const ratio = item.w && item.h ? item.w / item.h : 3 / 4;
          return (
            <div
              key={i}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ zIndex: i }}
            >
              <motion.button
                type="button"
                aria-label={`Enlarge image ${i + 1}: ${item.caption}`}
                onClick={() => setOpenIndex(i)}
                inert={!shown}
                className="pointer-events-auto relative w-full origin-bottom cursor-pointer overflow-hidden rounded-lg border border-hairline bg-surface-subtle shadow-sm"
                style={{ aspectRatio: ratio }}
                initial={false}
                animate={{
                  opacity: shown ? 1 : 0,
                  y: shown ? (fan ? FAN_Y[i] : 0) : "60%",
                  x: fan ? FAN_X[i] : REST_X[i],
                  rotate: fan
                    ? FAN_TILT[i]
                    : shown
                      ? REST_TILT[i]
                      : FLY_TILT[i],
                  scale: fan ? 1.02 : 1,
                }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
              >
                {item.src ? (
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 240px, 340px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-surface-subtle text-caption text-fg-subtle">
                    Image {i + 1}
                  </span>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      <HeroGallery
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
