"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useTransform,
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
 * A pinned, scroll-driven quote carousel. Each slide pairs an interview photo
 * with that person's quote. The section is taller than the viewport; while the
 * reader scrolls through it, the carousel PINS (position: sticky) and vertical
 * scroll drives the horizontal slide from one quote to the next. Each slide
 * dwells at a rest point with smooth transitions between, so the track never
 * releases the pin mid-slide — it always settles on a whole quote.
 *
 * DESKTOP-ONLY, mirroring ProfileStack: the pin needs a tall scroll region and a
 * steady pointer. Below `lg`, and for reduced motion, it renders a plain stacked
 * layout (photo + quote, one after another) with no pin or scroll-jacking.
 *
 * MUST be registered UNWRAPPED in mdxComponents (no RevealBlock): RevealBlock
 * applies a transform, and a transformed ancestor breaks position: sticky's
 * viewport reference, un-pinning the whole effect.
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
  return <PinnedCarousel items={items} />;
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

// ── Pinned, scroll-driven mode ────────────────────────────────────────────────
function PinnedCarousel({ items }: { items: Slide[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // Translate the track in PIXELS off a measured frame width — unambiguous and
  // responsive, avoiding the "% of which box?" trap when a flex track is wider
  // than its clip frame.
  const [frameW, setFrameW] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Section top → viewport top starts the pin; section bottom → viewport bottom
  // ends it. The whole Nancy→Chayan slide happens inside that pinned window.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const n = items.length;

  // Hold-aware keyframes: each slide DWELLS around its aligned rest point, and the
  // horizontal move happens between dwells — so the pin never releases with the
  // track parked awkwardly mid-slide. Half of each slide's scroll budget is dwell.
  const input = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      const center = n === 1 ? 0 : i / (n - 1);
      const half = 0.5 / n;
      pts.push(Math.max(0, center - half), Math.min(1, center + half));
    }
    return pts;
  }, [n]);
  // Output tracks the same keyframes: slide i rests at -i × frameW.
  const output = useMemo(
    () => input.map((_, k) => -Math.floor(k / 2) * frameW),
    [input, frameW],
  );
  const x = useTransform(scrollYProgress, input, output);

  return (
    <section
      ref={sectionRef}
      className="relative my-8"
      style={{ height: `${n * 100}svh` }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-8">
        <div ref={frameRef} className="w-full overflow-hidden">
          <motion.div className="flex items-stretch" style={{ x }}>
            {items.map((slide) => (
              <div
                key={slide.name}
                className="shrink-0"
                style={{ width: frameW || "100%" }}
              >
                <SlideView slide={slide} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll-progress hint — reassures that the pin is scroll-driven, not
            frozen, and reads as a carousel position indicator. */}
        <div className="h-0.5 w-24 overflow-hidden rounded-full bg-hairline">
          <motion.div
            className="h-full w-full origin-left rounded-full bg-fg"
            style={{ scaleX: scrollYProgress }}
          />
        </div>
      </div>
    </section>
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
      <blockquote className="text-sub-display measure-lede text-fg">
        &ldquo;{slide.quote}&rdquo;
        <figcaption className="text-body mt-4 font-medium text-fg-muted">
          {slide.name}
        </figcaption>
      </blockquote>
    </figure>
  );
}

// ── Static fallback (mobile + reduced motion): plain stacked pairs, no pin ─────
function StaticStack({ items }: { items: Slide[] }) {
  return (
    <div className="my-8 flex flex-col gap-12">
      {items.map((slide) => (
        <SlideView key={slide.name} slide={slide} />
      ))}
    </div>
  );
}
