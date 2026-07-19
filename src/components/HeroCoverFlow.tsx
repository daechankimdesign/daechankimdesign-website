"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { CoverFlow, type RenderImageProps } from "./CoverFlow";
import { HeroGallery } from "./HeroGallery";
import type { HeroStackItem } from "./HeroImageStack";

// One-time intro flip-through cadence: after the hero text finishes, the deck
// steps through each photo ~this long apart, then settles back on the first.
const FLIP_INTERVAL = 850;

// Deck geometry. A 4:3 landscape frame (the hero photos are documentary
// landscape / near-square); object-cover trims the two square shots top/bottom a
// touch. Kept small so the rotated side cards only just kiss the column edges
// (the stage is overflow-visible). CoverFlow scales this DOWN to fit narrower
// columns automatically, so these are the large-screen ceiling, not fixed px.
const ITEM_W = 260;
const ITEM_H = 195;

/**
 * next/image renderer for the deck. App Hosting serves the Firebase Storage URLs
 * raw (optimizer off), so `sizes` is a best-effort hint only. `priority` and
 * `loading` are mutually exclusive in next/image, so only pass `loading` when the
 * card isn't the eager/centered one. Empty src → a neutral placeholder.
 */
function renderImage(p: RenderImageProps) {
  if (!p.src) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-surface-subtle text-note text-fg-subtle">
        —
      </span>
    );
  }
  return (
    <Image
      src={p.src}
      alt={p.alt}
      width={p.width}
      height={p.height}
      className={p.className}
      draggable={p.draggable}
      sizes={p.sizes}
      priority={p.priority}
      loading={p.priority ? undefined : p.loading}
    />
  );
}

/**
 * The hero image deck — a horizontal cover-flow that replaces the old fly-in
 * pile. It fades in with the first header line (resting on the primary photo);
 * once the hero text has fully revealed (`flourish`), it auto-flips through every
 * photo once to highlight each, then settles back on the first. ANY real user
 * interaction (drag / wheel / key) aborts the flip-through and hands over manual
 * control — after that CoverFlow owns its own index and we never write it again,
 * so nothing fights the user. Clicking the centered card opens the shared
 * HeroGallery lightbox; clicking a side card centers it first. Reduced motion →
 * a static, flat, centered deck (no flip-through, no 3D).
 */
export function HeroCoverFlow({
  items,
  show,
  flourish,
  reduce,
}: {
  items: HeroStackItem[];
  /** Fade the deck in (tied to the first header line appearing). */
  show: boolean;
  /** Run the one-time flip-through (tied to the text fully revealing). */
  flourish: boolean;
  reduce: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Drives the deck's centered card. We only WRITE this during the intro
  // flip-through; CoverFlow re-syncs only when `initialIndex` actually CHANGES,
  // so once the flip-through ends (or is aborted) we leave it alone and the deck
  // is fully user-owned.
  const [driveIndex, setDriveIndex] = useState(0);
  const flipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // HERO_STACK is a stable module constant, so this maps once. Adapts the stack
  // shape to CoverFlow's item shape (title/subtitle are carried for structural
  // typing but not shown — showCaption is off).
  const cfItems = useMemo(
    () =>
      items.map((it, i) => ({
        id: i,
        image: it.src,
        title: it.headline || it.caption,
        subtitle: it.caption,
      })),
    [items],
  );

  const clearFlip = useCallback(() => {
    flipTimers.current.forEach(clearTimeout);
    flipTimers.current = [];
  }, []);

  // Reset to the primary photo whenever the hero resets (leaves the viewport), so
  // a re-entry replays the flip-through from the top.
  useEffect(() => {
    if (!show) {
      clearFlip();
      setDriveIndex(0);
    }
  }, [show, clearFlip]);

  // One-time flip-through: step through 1..n-1, then back to 0. Skipped under
  // reduced motion (the deck just rests, flat, on the primary photo).
  useEffect(() => {
    if (!flourish || reduce || cfItems.length < 2) return;
    const seq: number[] = [];
    for (let i = 1; i < cfItems.length; i++) seq.push(i);
    seq.push(0);
    seq.forEach((idx, k) => {
      flipTimers.current.push(
        setTimeout(() => setDriveIndex(idx), (k + 1) * FLIP_INTERVAL),
      );
    });
    return clearFlip;
  }, [flourish, reduce, cfItems.length, clearFlip]);

  return (
    <div className="relative order-first w-full shrink-0 self-center lg:order-none lg:w-[440px] lg:self-start">
      <motion.div
        // ANY real interaction cancels the auto flip-through. Capture phase so it
        // runs before CoverFlow's own wheel/drag handlers (which still fire and
        // drive the deck) — the abort and the navigation happen together.
        onPointerDownCapture={clearFlip}
        onWheelCapture={clearFlip}
        onKeyDownCapture={clearFlip}
        className="relative h-[320px] w-full sm:h-[360px] lg:h-[440px]"
        initial={false}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.96 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
      >
        <CoverFlow
          items={cfItems}
          initialIndex={driveIndex}
          itemWidth={ITEM_W}
          itemHeight={ITEM_H}
          centerGap={150}
          stackSpacing={48}
          rotation={48}
          showCaption={false}
          enableClickToSnap
          enableScroll
          reduceMotion={reduce}
          renderImage={renderImage}
          onItemClick={(_, index) => setOpenIndex(index)}
          className="h-full w-full"
        />
      </motion.div>

      {/* Same lightbox the fly-in stack used — pass the ORIGINAL stack items
          (headline / caption / full-res), not the adapted deck items. */}
      <HeroGallery
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </div>
  );
}
