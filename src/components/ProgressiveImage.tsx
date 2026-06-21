"use client";

import Image from "next/image";
import { useState } from "react";

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
 * next/image so each is optimized at its own width.
 */
export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  sizes = "100vw",
  priority,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-surface-subtle ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Low-res placeholder — small + blurred, loads fast */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="480px"
        quality={30}
        priority={priority}
        className="scale-105 object-cover blur-lg"
      />
      {/* Full-resolution — crossfades in */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
