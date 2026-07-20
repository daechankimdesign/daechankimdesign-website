"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { ProgressiveImage } from "./ProgressiveImage";

// Fly-in START tilt — each card enters clearly tilted, then settles to its
// resting scatter angle as it rises (matches the hero image stack's fly-in).
const FLY_TILT = [-18, 16, -15, 18, -14, 17];
// Resting scatter — a light, tight pile (deterministic → SSR-safe). Kept small
// so the last card (highest z) sits mostly on top rather than fanning wide.
const REST_TILT = [-6, 4, -3, 7, -4, 5];
const REST_X = [0, 8, -7, 6, -5, 7];

// Where in the page scroll the cards deal in. Spread across the scroll so a new
// photo flies in as you move through the page's sections; the last one lands by
// RANGE_END (before the bottom) and stays on top.
const RANGE_START = 0.06;
const RANGE_END = 0.9;

// The scroll-driven deal only makes sense while the portrait is PINNED, which
// happens at `lg`+ (the About aside is `lg:sticky`). Below that the portrait
// scrolls away with the page, so the cards would fly in off-screen — there we
// hide the gallery entirely and show only the base portrait. `reduce` on lg+
// still renders the settled pile (staticPile), just without animation.
// Module-scope store fns keep useSyncExternalStore's args stable, and this stays
// lint-clean (no setState-in-effect). SSR reports desktop; the client corrects
// on hydration.
const COMPACT_Q = "(max-width: 1023px)";
const subscribeCompact = (onChange: () => void) => {
  const mql = window.matchMedia(COMPACT_Q);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
const getCompact = () => window.matchMedia(COMPACT_Q).matches;
const getCompactServer = () => false;

type Props = {
  portrait: string;
  alt: string;
  images: string[];
  width?: number;
  height?: number;
  sizes?: string;
};

/**
 * The About portrait + gallery. Scrolling THROUGH the page deals the gallery
 * photos in one at a time: each scroll threshold TRIGGERS a card to fly up from
 * below the portrait — rising with a tilt and settling into a light pile on top,
 * exactly like the hero image stack. The scroll only triggers each card; the
 * fly-in itself is a state-driven tween that plays through cleanly (NOT
 * scroll-scrubbed), so photos never freeze mid-fade or ghost over each other.
 * Scrolling back up sends them away again.
 *
 * The deal is DESKTOP-ONLY: it needs the portrait pinned (`lg:sticky` on the
 * About aside). Below `lg` (mobile/tablet) the gallery is hidden entirely and
 * ONLY the base portrait shows — the stack would otherwise scroll out of view
 * mid-deal, and a settled pile would just cover the portrait with its top card.
 * On `lg`+ under reduced motion the pile renders static (no animation).
 */
export function ProfileStack({
  portrait,
  alt,
  images,
  width = 1447,
  height = 1446,
  sizes = "(max-width: 1024px) 20rem, 14rem",
}: Props) {
  const reduce = useReducedMotion();
  const compact = useSyncExternalStore(
    subscribeCompact,
    getCompact,
    getCompactServer,
  );
  // No deal animation when the portrait isn't pinned (below `lg`) or the reader
  // asked for reduced motion — both render the settled pile.
  const staticPile = !!reduce || compact;
  const total = images.length;

  // Whole-page scroll drives the deal. The portrait is sticky, so its own
  // position freezes while pinned — page progress is what actually advances.
  const { scrollYProgress } = useScroll();

  // Map scroll progress → how many cards should be in. Just past RANGE_START the
  // first card fires; by RANGE_END all are in. Discrete count → each increment
  // plays one clean fly-in tween (no scrubbing of the animation itself).
  const countFor = (p: number) => {
    if (total === 0) return 0;
    const frac = (p - RANGE_START) / (RANGE_END - RANGE_START);
    return Math.max(0, Math.min(total, Math.ceil(frac * total)));
  };

  // How many cards scroll has dealt so far (0..total). Updated from the scroll
  // handler — it starts at 0 (matching SSR) and the first scroll syncs it, so no
  // mount effect is needed. Reduced motion shows the whole pile at once.
  const [scrollCount, setScrollCount] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (staticPile) return; // no deal to drive — skip the scroll re-renders
    const c = countFor(p);
    setScrollCount((prev) => (prev === c ? prev : c));
  });
  const revealed = staticPile ? total : scrollCount;

  return (
    <div className="relative">
      {/* Base: the portrait — shown first, then the gallery deals in over it. */}
      <ProgressiveImage
        src={portrait}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
      />

      {/* Gallery cards — DESKTOP ONLY. On compact (< lg: mobile/tablet) the deal
          is disabled AND the stack is hidden entirely, so ONLY the base portrait
          shows (no settled pile — its top card would otherwise cover the
          portrait). On lg+ each flies up from below and settles into the pile as
          scroll deals it in (or a static pile under reduced motion). */}
      {!compact &&
        images.map((src, i) => {
        const shown = staticPile ? true : i < revealed;
        return (
          <motion.div
            key={`${src}-${i}`}
            className="absolute inset-0 origin-bottom overflow-hidden bg-surface-subtle shadow-sm"
            style={{ zIndex: i + 1 }}
            initial={false}
            animate={{
              opacity: shown ? 1 : 0,
              y: shown ? 0 : "60%",
              x: REST_X[i % REST_X.length],
              rotate: shown
                ? REST_TILT[i % REST_TILT.length]
                : FLY_TILT[i % FLY_TILT.length],
            }}
            transition={
              staticPile ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }
            }
          >
            <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
          </motion.div>
        );
      })}
    </div>
  );
}
