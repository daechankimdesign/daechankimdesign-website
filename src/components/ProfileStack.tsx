"use client";

import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ProgressiveImage } from "./ProgressiveImage";

// Deterministic per-card resting tilt + horizontal nudge (no random → SSR-safe,
// so the scattered stack looks the same on server and client).
const TILT = [-6, 5, -4, 7, -3, 6];
const NUDGE = [0, 8, -7, 6, -5, 7];

type Props = {
  portrait: string;
  alt: string;
  images: string[];
  width?: number;
  height?: number;
  sizes?: string;
};

/**
 * The About portrait as the base of a scroll-driven card stack. As the page
 * scrolls, the gallery images fly up one at a time and settle into a lightly
 * scattered pile on top of the portrait (a deck dealt onto it); scrolling back
 * up sends them away again. Built on the project's framer-motion + next/image —
 * no new dependency. Respects prefers-reduced-motion (portrait only, no fly-in).
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
  // Whole-page scroll drives the fly-in. The portrait is sticky, so its own
  // position freezes while pinned — page progress is what actually advances.
  const { scrollYProgress } = useScroll();

  return (
    <div className="relative">
      {/* Base: the portrait. */}
      <ProgressiveImage
        src={portrait}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className="rounded-md"
      />

      {/* Fly-in cards, absolutely stacked over the portrait. */}
      {!reduce &&
        images.map((src, i) => (
          <StackCard
            key={`${src}-${i}`}
            src={src}
            index={i}
            total={images.length}
            progress={scrollYProgress}
            sizes={sizes}
          />
        ))}
    </div>
  );
}

function StackCard({
  src,
  index,
  total,
  progress,
  sizes,
}: {
  src: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  sizes: string;
}) {
  // Each card flies in over its own slice of the early scroll range, in order.
  const span = 0.5 / Math.max(total, 1);
  const start = 0.06 + index * span;
  const end = start + span;

  const y = useTransform(progress, [start, end], ["65%", "0%"]);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const rotate = useTransform(
    progress,
    [start, end],
    [index % 2 ? 16 : -16, TILT[index % TILT.length]],
  );

  return (
    <motion.div
      className="absolute inset-0 origin-bottom overflow-hidden rounded-md border border-hairline bg-surface-subtle shadow-sm"
      style={{ y, opacity, rotate, x: NUDGE[index % NUDGE.length] }}
    >
      <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
    </motion.div>
  );
}
