"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

/**
 * A wide image (a service blueprint / journey map) shown at DOUBLE its
 * fit-to-width height so the detail is legible, then PANNED horizontally as the
 * figure scrolls through the viewport — the same inline, scroll-linked motion as
 * the interview QuoteCarousel: no pin, no reserved scroll height; the pan is
 * driven purely by the figure's position in the viewport. Because the image is
 * `zoom`× taller, it is also `zoom`× wider than the content column, and that
 * overflow is exactly what the scroll reveals, left → right.
 *
 * The pan runs only across a MIDDLE band of the figure's pass ([PAN_START,
 * PAN_END]), holding the left edge until it's well into view and the right edge
 * as it leaves — so it starts later and finishes earlier than the raw scroll.
 *
 * CLICK TO INSPECT: click magnifies the blueprint and the zoom follows the
 * cursor (a hover-zoom lens), so the fine print is readable; click again — or
 * move off — to release. The magnify scales a viewport-sized STAGE around the
 * cursor point, so its origin stays correct even though the image is panned and
 * overflowing.
 *
 * Mobile / coarse pointer / reduced motion fall back to a plain horizontally
 * swipeable strip (native overflow-x) — the reader drives it, no scroll-linked
 * movement and no hover lens — mirroring QuoteCarousel's static fallback.
 */

// Where in the figure's pass the horizontal pan runs (0 = entering at the
// viewport bottom, 1 = leaving past the top). A NARROWER band starts the pan
// later and finishes it earlier; widen it toward [0,1] to spread it out.
const PAN_START = 0.4;
const PAN_END = 0.7;
// Click-to-inspect magnification, on top of the 2× height the frame already shows.
const ZOOM_SCALE = 2.2;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export function ScrollImage({
  src,
  alt,
  width,
  height,
  caption,
  zoom = 2,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  zoom?: number;
}) {
  const reduce = useReducedMotion();
  const compact = useSyncExternalStore(
    subscribeCompact,
    getCompact,
    getCompactServer,
  );

  // The frame's box: full column width, height = zoom × the fit-to-width height.
  // Expressed as an aspect ratio so it stays responsive with no pixel math.
  const frameAspect = `${width} / ${height * zoom}`;

  const captionEl = caption ? (
    <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption>
  ) : null;

  // Reduced motion / touch / small screens: a plain swipeable strip, same box,
  // native horizontal scroll. No scroll-linked motion, no hover lens.
  if (reduce || compact) {
    return (
      <figure className="my-8">
        <div
          className="overflow-x-auto overscroll-x-contain"
          style={{ aspectRatio: frameAspect }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pan image must overflow its box at natural width; next/image `fill` stretches to the box */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="block h-full w-auto max-w-none select-none bg-surface-subtle"
          />
        </div>
        {captionEl}
      </figure>
    );
  }

  return (
    <ScrollPan
      src={src}
      alt={alt}
      width={width}
      height={height}
      frameAspect={frameAspect}
      zoom={zoom}
      caption={captionEl}
    />
  );
}

// ── Desktop: scroll-linked horizontal pan + click-to-inspect lens ─────────────
function ScrollPan({
  src,
  alt,
  width,
  height,
  frameAspect,
  zoom,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  frameAspect: string;
  zoom: number;
  caption: ReactNode;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  // The image is exactly `zoom`× the viewport width (guaranteed by the box's
  // aspect ratio + the image's h-full/w-auto), so the amount to pan is simply
  // (zoom − 1)× the viewport's own width — no image measurement needed.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setOverflow(el.clientWidth * (zoom - 1));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoom]);

  // 0 as the figure enters at the viewport bottom → 1 as it leaves past the top;
  // the pan itself runs only across the middle [PAN_START, PAN_END] band.
  const { scrollYProgress } = useScroll({
    target: figureRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [PAN_START, PAN_END], [0, -overflow]);
  const progress = useTransform(scrollYProgress, [PAN_START, PAN_END], [0, 1]);

  // Track the cursor as a % of the viewport box — the magnify origin. Because the
  // stage we scale is exactly viewport-sized, this maps to the point under the
  // cursor even while the image is panned and overflowing.
  const pointAt = (e: React.MouseEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
    const py = clamp(((e.clientY - r.top) / r.height) * 100, 0, 100);
    setOrigin(`${px}% ${py}%`);
  };

  return (
    <figure ref={figureRef} className="my-8">
      <div
        ref={viewportRef}
        className={`overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={(e) => {
          pointAt(e);
          setZoomed((z) => !z);
        }}
        onMouseMove={(e) => {
          if (zoomed) pointAt(e);
        }}
        onMouseLeave={() => setZoomed(false)}
        style={{ aspectRatio: frameAspect }}
      >
        {/* Stage: viewport-sized. It carries the click-to-inspect magnify (scaled
            around the cursor); the track inside carries the scroll pan. Two
            separate transforms, so they compose without fighting. */}
        <motion.div
          className="h-full w-full"
          animate={{ scale: zoomed ? ZOOM_SCALE : 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ transformOrigin: origin }}
        >
          <motion.div className="h-full w-max" style={{ x }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pan image must overflow its box at natural width; next/image `fill` stretches to the box */}
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block h-full w-auto max-w-none select-none bg-surface-subtle"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Pan progress — fills left → right as the blueprint reveals. */}
      <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-hairline">
        <motion.div
          className="h-full w-full origin-left bg-fg"
          style={{ scaleX: progress }}
        />
      </div>

      {caption}
    </figure>
  );
}

// ── Desktop-only gate (same store pattern as QuoteCarousel/ProfileStack) ───────
const COMPACT_Q = "(max-width: 1023px)";
const subscribeCompact = (onChange: () => void) => {
  const mql = window.matchMedia(COMPACT_Q);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
const getCompact = () => window.matchMedia(COMPACT_Q).matches;
const getCompactServer = () => false;
