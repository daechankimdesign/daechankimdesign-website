"use client";

import { useRef, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { ProgressiveImage } from "../ProgressiveImage";
import { EASE_OUT, DURATION } from "@/lib/motion";

type Entrance = "bottom" | "top" | "left" | "right";

type FrameItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Edge the card travels in FROM: `bottom` rises, `left` slides rightward into
      place. Defaults to `bottom`, matching the page's fade-up language. Ignored in
      `background` mode, where the panel always drops in from the top. */
  from?: Entrance;
};

/** A screenshot rendered blurred behind the foreground cards — the "app window
    floating over its own context" look, instead of the flat tinted panel. */
type Background = { src: string; alt?: string };

/**
 * A set of screenshots presented together on a panel. Each keeps its own file
 * and native aspect; nothing is baked into a composite.
 *
 * Two panel treatments:
 *  - DEFAULT (Oria): a flat `bg-surface-sunken` seamless (in dark this is the
 *    FOOTER colour, so framed screenshots sit in the same well). Cards lie side by side
 *    and `flex-grow` by aspect against `flex-basis: 0`, so every card resolves to
 *    the SAME height even from slightly different source ratios. Below `sm` they
 *    stack full-width and the ratio is inert. Each card reveals once on scroll-in.
 *  - `background` (Sucholary): the panel's surface becomes a BLURRED screenshot —
 *    the reading environment the UI actually lives in — with a light scrim over
 *    it. The foreground cards float centered and size-capped (`foregroundWidth`)
 *    so the blurred context reads around them. This mode is a SCROLL-TRIGGERED
 *    sequence that REPLAYS every time it re-enters view (no exit animation — the
 *    reset snaps while off-screen): (1) the screenshot fades in sharp, so the
 *    highlighted passage registers, (2) it blurs back into context, (3) the panel
 *    drops in from the top over it.
 *
 * IMAGE-FRAME RULE (see ProgressiveImage): content images stay square and
 * borderless, and the panel obeys that — it is a flat, square-cornered block. The
 * radius here is on the INNER cards, which stand in for the depicted product's own
 * panel surface — the same license the SandboxEmbed device bezel takes. The corner
 * belongs to the UI in the picture, not to the picture frame.
 */

// Starting displacement per entrance edge; each card animates back to 0 (default mode).
const OFFSET: Record<Entrance, { x?: number; y?: number }> = {
  bottom: { y: 24 },
  top: { y: -24 },
  left: { x: -24 },
  right: { x: 24 },
};

// Mirrors RevealBlock: settle just before the block is fully on-screen, once (default mode).
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

// Beat between cards. Deliberately longer than the header's line cascade
// (STAGGER, 0.15) so a sequence reads as "and then" rather than "at the same
// time". EASE_OUT is expo — most of a card's travel happens in the first ~0.5s,
// so the next one launches as the previous settles.
const BEAT = 0.45;

// DEFAULT-mode card: flat, rounded, softly shadowed, and grown to a shared height
// by aspect ratio (so a row of screenshots aligns tops and bottoms).
const CARD_CLASS =
  "overflow-hidden rounded-xl shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.16)] sm:flex-[var(--frame-grow)_1_0%]";

// BACKGROUND-mode card base: floats over the blurred backdrop.
const BG_CARD_BASE =
  "overflow-hidden rounded-xl shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.16)]";

// A card row sizes by aspect (flex-grow = aspect, flex-basis 0) so mixed-aspect
// cards resolve to a shared HEIGHT: a portrait phone stays narrow beside a
// landscape desktop. But flex-grow only FILLS the track when the grows sum to
// ≥ 1; a lone portrait card (aspect < 1) would take just that fraction and shrink
// oddly. So a single card fills with `w-full`, and only multi-card rows size by
// aspect. (Stacked below `sm`, every card is full width.)
const bgCardClass = (count: number) =>
  count > 1
    ? `${BG_CARD_BASE} sm:flex-[var(--frame-grow)_1_0%]`
    : `${BG_CARD_BASE} w-full`;

// Default max width of the floating foreground cluster in `background` mode, so
// the blurred context stays visible around it.
const DEFAULT_FOREGROUND_WIDTH = 340;

// How far the panel travels down from the top in `background` mode (px).
const PANEL_DROP = 40;
// The backdrop scrim — a translucent wash of the CANVAS token over the blurred
// screenshot so it recedes into the page (theme-aware: near-white in light,
// warm near-black in dark) and the foreground reads.
const SCRIM = "color-mix(in srgb, var(--color-canvas) 38%, transparent)";
// The blur the screenshot settles to (also the static value under reduced motion).
const BG_BLUR = "blur(12px)";
// Scale the backdrop past its clip so the blur has no hard edge.
const BG_SCALE = 1.1;

// ── background-mode choreography ──────────────────────────────────────────────
// The stage carries the in-view label to its children via context; it replays on
// every re-entry (once:false). Children reset to `hidden` INSTANTLY (duration 0)
// so the off-screen reset is never seen as an exit animation.
const BG_VIEWPORT = { once: false, amount: 0.35 } as const;
const STAGE: Variants = { hidden: {}, shown: {} };

// Backdrop: fade in SHARP first (opacity over the first ~22%), then blur.
const BACKDROP_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale: BG_SCALE,
    filter: "blur(0px)",
    transition: { duration: 0 },
  },
  shown: {
    opacity: [0, 1, 1],
    scale: BG_SCALE,
    filter: ["blur(0px)", "blur(0px)", BG_BLUR],
    transition: { duration: DURATION, times: [0, 0.22, 1], ease: EASE_OUT },
  },
};

// Panel: drops in from the top, beginning as the backdrop blur is underway, so the
// three beats read as "appear, blur, and then the panel arrives".
const PANEL_LEAD = 1.0;
const PANEL_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -PANEL_DROP, transition: { duration: 0 } },
  shown: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION, ease: EASE_OUT, delay: PANEL_LEAD + i * BEAT },
  }),
};

export function ImageFrame({
  items = [],
  caption,
  background,
  foregroundWidth = DEFAULT_FOREGROUND_WIDTH,
}: {
  items?: FrameItem[];
  caption?: string;
  background?: Background;
  foregroundWidth?: number;
}) {
  const reduce = useReducedMotion();
  // Default-mode reveal: ONE trigger on the frame. `useInView` fires once when the
  // figure scrolls into view; each card then animates with a per-card delay, so
  // they cascade left→right (top→bottom when stacked). Ref is attached only in
  // default mode; harmless (stays false) in background mode.
  const frameRef = useRef<HTMLElement>(null);
  const frameInView = useInView(frameRef, VIEWPORT);
  if (!items.length) return null;

  const captionEl = caption ? (
    <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption>
  ) : null;

  const growStyle = (item: FrameItem) =>
    ({ "--frame-grow": String(item.width / item.height) }) as CSSProperties;

  const progressive = (item: FrameItem) => (
    <ProgressiveImage
      src={item.src}
      alt={item.alt}
      width={item.width}
      height={item.height}
      sizes="(max-width: 640px) 100vw, 400px"
    />
  );

  // ── Background mode: floating panel over a blurred screenshot ────────────────
  if (background) {
    const scrim = (
      <div className="absolute inset-0" style={{ backgroundColor: SCRIM }} />
    );
    // Centering: the OUTER frame is a flex box with `justify-center`; the
    // foreground is a DEFINITE-width flex item (never `w-full`/100%, which would
    // lay out full-width first — leaving no free space for justify — then shrink,
    // pinning it left). A definite width centers reliably in the frame's own box.
    // `maxWidth:100%` keeps it inside the frame on narrow screens.
    const foregroundStyle = { width: foregroundWidth, maxWidth: "100%" };
    const foregroundClass =
      "relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8";

    // Reduced motion: the settled state, static — backdrop blurred, panel in place.
    if (reduce) {
      return (
        <figure className="my-8">
          <div className="relative flex items-center justify-center overflow-hidden rounded-3xl p-8 sm:p-14">
            <div aria-hidden className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative blurred backdrop; the optimizer is off on deploy and next/image adds no value here */}
              <img
                src={background.src}
                alt=""
                className="h-full w-full scale-110 object-cover"
                style={{ filter: BG_BLUR }}
              />
              {scrim}
            </div>
            <div className={foregroundClass} style={foregroundStyle}>
              {items.map((item) => (
                <div
                  key={item.src}
                  style={growStyle(item)}
                  className={bgCardClass(items.length)}
                >
                  {progressive(item)}
                </div>
              ))}
            </div>
          </div>
          {captionEl}
        </figure>
      );
    }

    // Scroll-triggered, replays on re-entry: appear sharp → blur → panel drops in.
    return (
      <figure className="my-8">
        <motion.div
          className="relative flex items-center justify-center overflow-hidden rounded-3xl p-8 sm:p-14"
          variants={STAGE}
          initial="hidden"
          whileInView="shown"
          viewport={BG_VIEWPORT}
        >
          <div aria-hidden className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative blurred backdrop; the optimizer is off on deploy and next/image adds no value here */}
            <motion.img
              src={background.src}
              alt=""
              variants={BACKDROP_VARIANTS}
              className="h-full w-full object-cover"
            />
            {scrim}
          </div>
          <div className={foregroundClass} style={foregroundStyle}>
            {items.map((item, i) => (
              <motion.div
                key={item.src}
                custom={i}
                variants={PANEL_VARIANTS}
                style={growStyle(item)}
                className={bgCardClass(items.length)}
              >
                {progressive(item)}
              </motion.div>
            ))}
          </div>
        </motion.div>
        {captionEl}
      </figure>
    );
  }

  // ── Default mode: flat tinted seamless. ONE trigger on the figure — as the
  // frame scrolls into view (frameInView), each card animates with delay i*BEAT,
  // so they cascade left→right in a row (top→bottom when stacked). ─────────────
  const panelClass =
    "flex flex-col gap-6 bg-surface-sunken p-6 sm:flex-row sm:items-start sm:gap-10 sm:p-10";

  return (
    <figure ref={frameRef} className="my-8">
      <div className={panelClass}>
        {items.map((item, i) =>
          reduce ? (
            <div key={item.src} style={growStyle(item)} className={CARD_CLASS}>
              {progressive(item)}
            </div>
          ) : (
            <motion.div
              key={item.src}
              style={growStyle(item)}
              className={CARD_CLASS}
              initial={{ opacity: 0, ...OFFSET[item.from ?? "bottom"] }}
              animate={frameInView ? { opacity: 1, x: 0, y: 0 } : undefined}
              transition={{ duration: DURATION, ease: EASE_OUT, delay: i * BEAT }}
            >
              {progressive(item)}
            </motion.div>
          ),
        )}
      </div>
      {captionEl}
    </figure>
  );
}
