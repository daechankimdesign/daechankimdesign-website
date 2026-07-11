"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Progressive image (rules §6): a 480px low-res copy loads first (blurred),
 * then the full-resolution asset crossfades in on load. Both layers use
 * next/image so each is optimized at its own width. Once a src has loaded this
 * session, later mounts start already-loaded and skip the blur-up + crossfade.
 *
 * IMAGE-FRAME RULE (project-wide): content images are SQUARE and BORDERLESS by
 * default. This component adds no `rounded-*` and no `border-*`, and callers must
 * not pass them via `className`. Rounded corners / hairline borders are reserved
 * for UI chrome (the SandboxEmbed device bezel, nav pill, modal cards, swatches),
 * never for photo/thumbnail frames. Keep new image frames flat.
 */

// Session cache of srcs whose full-res has finished loading (persists across
// client navigations, so re-entering a route doesn't replay the placeholder).
const loadedSrcs = new Set<string>();

export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  sizes = "100vw",
  priority,
}: Props) {
  // Start already loaded if this src rendered earlier this session — no blur-up.
  const [loaded, setLoaded] = useState(() => loadedSrcs.has(src));
  const imgRef = useRef<HTMLImageElement>(null);

  const markLoaded = () => {
    loadedSrcs.add(src);
    setLoaded(true);
  };

  useEffect(() => {
    // Catch browser-cached images that finished before the load listener attached.
    if (imgRef.current?.complete) markLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated formats (GIF, animated WebP) bypass the optimizer (which would
  // freeze them to one frame) and skip the duplicate blur layer (no point
  // downloading a multi-frame asset twice). All project WebPs are animated.
  const isAnimated = /\.(gif|webp)($|\?)/i.test(src);
  if (isAnimated) {
    return (
      <div
        className={`relative overflow-hidden bg-surface-subtle ${className ?? ""}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-surface-subtle ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Low-res placeholder — small + blurred, loads fast. It fades OUT as the
          full image fades in (a true crossfade), and stays aligned with it (no
          scale). Fading it out is what stops a transparent PNG from revealing a
          ghost of this layer behind the loaded image. */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="480px"
        quality={45}
        priority={priority}
        className={`object-cover transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        // Minimal, tight blur (inline so it always applies).
        style={{ filter: "blur(1px)" }}
      />
      {/* Full-resolution — crossfades in */}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={markLoaded}
        className={`object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
