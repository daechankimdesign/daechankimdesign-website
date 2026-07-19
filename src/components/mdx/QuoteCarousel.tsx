"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { ProgressiveImage } from "../ProgressiveImage";

type Slide = {
  /** The quote text, WITHOUT surrounding quotation marks (added by the component). */
  quote: string;
  /** Speaker's name, shown as the attribution. */
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * A quote carousel that pairs each interview photo with that person's quote and
 * advances horizontally as you scroll.
 *
 * INLINE — no pin, no reserved scroll height. It sits in the document flow like
 * any other figure (`my-8`), so the prose above and below keeps its natural
 * spacing: NO tall pinned section wedging the text apart, no vertical gaps.
 *
 * SNAP, NOT SCRUB — the fix for "stops mid-slide": the figure's position in the
 * viewport selects a DISCRETE active index (quote 0 while it's in the lower half
 * of its pass, the next as it crosses center), and the track TWEENS to that quote
 * with a spring. A scrubbed track parks half-slid wherever you stop; this one
 * always animates to a whole quote and settles there. Same pattern as the About
 * page's ProfileStack (scroll-triggered discrete step → clean tween).
 *
 * Mobile and reduced-motion render a plain stacked layout (each pair one after
 * another) — the most natural reading on a phone.
 */
export function QuoteCarousel({ items = [] }: { items?: Slide[] }) {
  const reduce = useReducedMotion();
  const compact = useSyncExternalStore(
    subscribeCompact,
    getCompact,
    getCompactServer,
  );

  if (!items.length) return null;
  if (reduce || compact) return <StaticStack items={items} />;
  return <ScrollCarousel items={items} />;
}

// ── Desktop-only gate (same store pattern as ProfileStack) ────────────────────
const COMPACT_Q = "(max-width: 1023px)";
const subscribeCompact = (onChange: () => void) => {
  const mql = window.matchMedia(COMPACT_Q);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
const getCompact = () => window.matchMedia(COMPACT_Q).matches;
const getCompactServer = () => false;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

// Each slide caps at SLIDE_PCT of the frame so the neighbouring slides peek in at
// the edges; PEEK is what shows per side (5% when the slide is 90%).
const SLIDE_PCT = 90;
const PEEK = (100 - SLIDE_PCT) / 2;

// ── Inline, snap-to-quote peek carousel (no pin, no reserved height) ──────────
function ScrollCarousel({ items }: { items: Slide[] }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  // Progress 0 as the figure enters at the viewport bottom, 1 as it leaves past
  // the top; 0.5 is the figure centered. The [0,1] range splits into n equal
  // zones, one per quote, so crossing a zone boundary flips the active quote.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(clamp(Math.floor(p * n), 0, n - 1));
  });

  // Edge-align the ends so the carousel reads as part of the text column: the
  // FIRST slide sits flush-left (its photo lines up with the article's left
  // edge), the LAST flush-right, and any middle slide stays centred with PEEK%
  // of each neighbour showing. Value is a % of the track's own width — no pixel
  // measurement. Springs between whole slides, so it never parks mid-slide.
  const offsetPct =
    active <= 0
      ? 0
      : active >= n - 1
        ? 100 - SLIDE_PCT * n
        : PEEK - SLIDE_PCT * active;

  return (
    <figure ref={ref} className="my-8">
      <div className="w-full overflow-hidden">
        <motion.div
          className="flex items-stretch"
          animate={{ x: `${offsetPct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22, mass: 1 }}
        >
          {items.map((slide) => (
            <div
              key={slide.name}
              // pr-3, not px-3: a right-only gutter keeps every card's LEFT edge
              // flush, so the flush-left first slide's photo aligns with the text.
              className="min-w-0 shrink-0 pr-3"
              style={{ flexBasis: `${SLIDE_PCT}%` }}
            >
              <SlideView slide={slide} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Segmented indicator — the active quote reads as a wider bar. */}
      {n > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {items.map((slide, i) => (
            <span
              key={slide.name}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-fg" : "w-1.5 bg-hairline"
              }`}
            />
          ))}
        </div>
      ) : null}
    </figure>
  );
}

// One slide: photo beside the quote (stacked below `sm`).
function SlideView({ slide }: { slide: Slide }) {
  return (
    <figure className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10">
      <div className="overflow-hidden rounded-xl shadow-[0_2px_6px_-2px_rgba(0,0,0,0.06),0_16px_36px_-12px_rgba(0,0,0,0.16)]">
        <ProgressiveImage
          src={slide.src}
          alt={slide.alt}
          width={slide.width}
          height={slide.height}
          sizes="(max-width: 640px) 100vw, 400px"
        />
      </div>
      {/* Matches the project's quote hierarchy (the MDX `blockquote` / About
          endorsement): left hairline, 16px body, muted, with a bold-muted name.
          NOT text-sub-display, which is a hero token, not a quote token. */}
      <blockquote className="hairline-l text-body pl-6 text-fg-muted">
        &ldquo;{slide.quote}&rdquo;
        <figcaption className="text-body mt-4 font-medium text-fg-muted not-italic">
          {slide.name}
        </figcaption>
      </blockquote>
    </figure>
  );
}

// ── Static fallback (mobile + reduced motion): plain stacked pairs ─────────────
function StaticStack({ items }: { items: Slide[] }) {
  return (
    <div className="my-8 flex flex-col gap-12">
      {items.map((slide) => (
        <SlideView key={slide.name} slide={slide} />
      ))}
    </div>
  );
}
