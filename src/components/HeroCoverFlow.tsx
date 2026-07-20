"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { CoverFlow, type RenderImageProps } from "./CoverFlow";
import { HeroGallery } from "./HeroGallery";
import type { HeroStackItem } from "./HeroImageStack";

// Deck geometry — prominent, right-anchored, SQUARE frame (object-cover trims the
// two landscape shots to square; the two square shots fit as-is). This is the MAX
// card size: CoverFlow scales it DOWN to fit the column, and the column itself is
// fluid (clamp, below), so the card is responsive to the viewport with this as
// its ceiling.
const ITEM_W = 360;
const ITEM_H = 360;

// Off-centre cards fade hard toward the white canvas so the focused photo clearly
// leads and any side-card bleed all but disappears. A flat veil, NOT a gradient.
const SIDE_VEIL = 0.82;

// Initial appearance: a QUICK opacity fade — deliberately well under one 600ms text
// beat, so photo 1 is fully visible EARLY in its beat and gets a clear still moment
// before photo 2 shifts in, instead of fading the entire beat and being replaced as
// it finishes (that read as photo 1 being "sandwiched" between its own arrival and
// photo 2's trigger). The from-the-side MOTION is the cover-flow sweep itself
// (ENTRANCE_OFFSET), NOT a wrapper slide — one continuous motion, no break.
const APPEAR_DURATION = 0.35;
// How far RIGHT (in card slots) photo 1 starts before sweeping into focus on appear.
// Kept SMALL so photo 1 lands focused quickly instead of spending its dwell entering
// as a tilted side card. 0 = fade in already centered (no from-the-side motion).
const ENTRANCE_OFFSET = 0.6;

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
 * pile. On the first header line it fades in WHILE photo 1 sweeps into focus from
 * the side (one continuous motion — no unfocused hold, no break); thereafter the
 * CENTERED photo tracks the hero's text reveal: each line that steps in slides the
 * deck to the next photo,
 * so focus changes land on the same beats as the text (`focus`, derived from the
 * reveal counter). `initialIndex` is driven straight from `focus` — CoverFlow
 * springs to it on change, and once the reveal ends `focus` is constant, so the
 * deck naturally hands over to manual control (drag / wheel / click) with no
 * fight. Clicking the centered card opens the shared HeroGallery lightbox;
 * clicking a side card centers it first. Reduced motion → a static, flat deck on
 * the primary photo.
 *
 * Prominent + right-anchored: a wide column pulled into the page's right gutter
 * (safe — html/body are `overflow-x: clip`, so the right bleed clips at the
 * viewport edge, never a scrollbar). Shifting the deck right also carries the side
 * cards clear of the headline, so nothing paints over the text.
 */
export function HeroCoverFlow({
  items,
  show,
  focus,
  reduce,
}: {
  items: HeroStackItem[];
  /** Fade the deck in (tied to the second header line appearing). */
  show: boolean;
  /**
   * Which photo (index) the deck centers, from the hero's text-reveal counter.
   * Photo 1 (index 0) sweeps in from the side on appear; higher indices track the
   * text as it advances.
   */
  focus: number;
  reduce: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Adapts the stack shape to CoverFlow's item shape (title/subtitle are carried
  // for structural typing but not shown — showCaption is off).
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

  // Reduced motion rests flat on the primary photo (no sequence); otherwise the
  // deck follows the text-reveal focus. Derived in render — no effect/state sync
  // fights the deck.
  const centerIndex = reduce ? 0 : focus;

  return (
    <div className="relative order-first w-full shrink-0 self-center overflow-visible lg:order-none lg:-mr-[60px] lg:w-[clamp(380px,40vw,500px)] lg:self-start">
      <motion.div
        className="relative h-[300px] w-full overflow-visible sm:h-[360px] lg:h-[440px]"
        initial={false}
        // Initial appearance — a plain opacity fade (NO wrapper slide: that read as
        // a separate rigid motion before the cards re-arranged — the "weird break").
        // The from-the-side motion is now ONE continuous cover-flow sweep: on appear
        // the spring is pre-rolled ENTRANCE_OFFSET slots right and eases straight
        // into photo 1 (see CoverFlow `entranceOffset`) — no gap between arrival and
        // first focus. Inert under reduced motion.
        animate={{ opacity: show ? 1 : 0 }}
        transition={
          reduce ? { duration: 0 } : { duration: APPEAR_DURATION, ease: EASE_OUT }
        }
      >
        <CoverFlow
          items={cfItems}
          initialIndex={centerIndex}
          itemWidth={ITEM_W}
          itemHeight={ITEM_H}
          centerGap={100}
          stackSpacing={40}
          rotation={45}
          showCaption={false}
          sideVeilOpacity={SIDE_VEIL}
          hoverExpand={1.5}
          hoverLiftPx={12}
          hoverRevealSides
          appear={show}
          entranceOffset={ENTRANCE_OFFSET}
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
