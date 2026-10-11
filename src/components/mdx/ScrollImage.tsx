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
 * The pan runs only while the whole frame is on screen: it starts once the
 * frame's bottom edge is in view and has reached the right edge just before the
 * frame's top meets the top of the viewport, so the end of a flow is read with
 * the frame still in view, not after it has scrolled away.
 *
 * CLICK TO INSPECT: click magnifies the blueprint and the zoom follows the
 * cursor (a hover-zoom lens), so the fine print is readable; click again — or
 * move off — to release. The magnify scales a viewport-sized STAGE around the
 * cursor point, so its origin stays correct even though the image is panned and
 * overflowing.
 *
 * The pan runs at every width, phones included, so a reader only ever scrolls
 * down: no horizontal strip that captures the page scroll. Small screens and
 * touch skip the hover lens. Reduced motion falls back to a plain horizontally
 * swipeable strip (native overflow-x) the reader drives.
 */

// Where in the frame's fully visible stretch the pan runs (0 = its bottom edge
// reaches the viewport bottom, 1 = its top reaches the viewport top). Ending
// short of 1 finishes the pan with the frame still clear of the top.
const PAN_START = 0.05;
const PAN_END = 0.85;
// The tallest the frame may be, as a share of the window, so the whole frame
// fits on screen while it pans and the end of the flow is read before it leaves.
// Only the height is capped: the frame is always the full column width (an
// explicit width: 100%, or aspect-ratio would shrink the width to match).
const MAX_FRAME = "55svh";
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
  zoom: baseZoom = 2,
  compactZoom,
  background,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  zoom?: number;
  /** The zoom on small screens and touch, where the column is narrow; defaults
   *  to `zoom`. A larger value keeps a wide map's type legible on a phone. */
  compactZoom?: number;
  /** The image's own sheet colour (e.g. "#ffffff" for a white board), drawn
   *  behind it in both themes. Needed for a transparent export with dark lines,
   *  which otherwise sits on the dark surface in dark mode. */
  background?: string;
}) {
  const reduce = useReducedMotion();
  const compact = useSyncExternalStore(
    subscribeCompact,
    getCompact,
    getCompactServer,
  );
  const zoom = compact ? (compactZoom ?? baseZoom) : baseZoom;

  // The frame's box: full column width, height = zoom × the fit-to-width height.
  // Expressed as an aspect ratio so it stays responsive with no pixel math.
  const frameAspect = `${width} / ${height * zoom}`;

  const captionEl = caption ? (
    <figcaption className="text-note mt-2 text-fg-muted">{caption}</figcaption>
  ) : null;

  // Reduced motion: a plain swipeable strip, same box, native horizontal
  // scroll. No scroll-linked motion, no hover lens.
  if (reduce) {
    return (
      <figure className="my-8">
        <div
          className="overflow-x-auto overscroll-x-contain"
          style={{ width: "100%", aspectRatio: frameAspect, maxHeight: MAX_FRAME }}
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
            className={`block h-full w-auto max-w-none select-none ${background ? "" : "bg-surface-panel"}`}
            style={background ? { background } : undefined}
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
      caption={captionEl}
      background={background}
      lens={!compact}
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
  caption,
  background,
  lens,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  frameAspect: string;
  /** The click-to-inspect magnifier; off on small screens and touch. */
  lens: boolean;
  caption: ReactNode;
  background?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  // The image fills the frame's height (h-full/w-auto), so its width is the
  // frame's height × the image's aspect, and the amount to pan is whatever of
  // that is wider than the frame. Measured from the frame's own box, so it
  // holds when MAX_FRAME caps the height below `zoom`×.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () =>
      setOverflow(Math.max(0, (el.clientHeight * width) / height - el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  // 0 as the frame is first fully in view (bottom edge at the viewport bottom)
  // → 1 as its top reaches the viewport top; the pan runs across
  // [PAN_START, PAN_END] of that.
  const { scrollYProgress } = useScroll({
    target: viewportRef,
    offset: ["end end", "start start"],
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
    <figure className="my-8">
      <div
        ref={viewportRef}
        className={`overflow-hidden ${lens ? (zoomed ? "cursor-zoom-out" : "cursor-zoom-in") : ""}`}
        onClick={(e) => {
          if (!lens) return;
          pointAt(e);
          setZoomed((z) => !z);
        }}
        onMouseMove={(e) => {
          if (lens && zoomed) pointAt(e);
        }}
        onMouseLeave={() => setZoomed(false)}
        style={{ width: "100%", aspectRatio: frameAspect, maxHeight: MAX_FRAME }}
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
              className={`block h-full w-auto max-w-none select-none ${background ? "" : "bg-surface-panel"}`}
              style={background ? { background } : undefined}
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
const COMPACT_Q = "(max-width: 1023px), (pointer: coarse)";
const subscribeCompact = (onChange: () => void) => {
  const mql = window.matchMedia(COMPACT_Q);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
const getCompact = () => window.matchMedia(COMPACT_Q).matches;
const getCompactServer = () => false;
