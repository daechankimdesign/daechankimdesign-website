"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Bookmark, FlaskSolid } from "iconoir-react";
import { ProgressiveImage } from "./ProgressiveImage";
import { drawHighlight } from "@/lib/highlight";
import type { BoardItem, Span } from "@/lib/mdx";
import posthog from "posthog-js";

const isVideo = (src: string) => /\.mp4($|\?)/i.test(src);

// Fixed ratio + representative dims per span tier (Phase 1: rhythm from SIZE, not
// per-item ratio). `sizes` is a best-effort hint — on the App Hosting deploy the
// optimizer is off and files serve raw, so the real budget lever is source file
// size, not this string (kept correct for local dev regardless).
const TIER: Record<Span, { w: number; h: number; sizes: string }> = {
  standard: {
    w: 1200,
    h: 900, // 4:3
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw",
  },
  feature: {
    w: 1500,
    h: 1000, // 3:2
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 46vw",
  },
  wide: {
    w: 1600,
    h: 900, // 16:9
    sizes: "(max-width: 1024px) 100vw, 62vw",
  },
};

/**
 * One tile on the work board. The whole tile is a single Link to its detail page
 * (case-study or play, resolved from the item's `basePath`). Media sits flush and
 * flat (image-frame rule: no rounded/border on content images), with the caption
 * block beneath: a type eyebrow, the title, a clamped one-line descriptor, and a
 * tag row — all using the project's existing type tokens.
 *
 * Hover: the title gets the shared hand-drawn highlighter — drawn on pointer-in,
 * wiped out left→right on pointer-out — the SAME mark the About experience items
 * use, instead of a plain opacity dim.
 */
export function WorkTile({
  item,
  typeLabel,
  statusLabel,
  priority = false,
}: {
  item: BoardItem;
  /** Localized "Case Study" / "Play" label for the eyebrow. */
  typeLabel: string;
  /** Localized "Shipped" / "Concept" label. Omitted ⇒ no status badge. */
  statusLabel?: string;
  /** Eager-load this tile's image (use only for the first/LCP tile). */
  priority?: boolean;
}) {
  const reduce = useReducedMotion();
  const markRef = useRef<HTMLSpanElement>(null);
  const wipeRef = useRef<(() => void) | null>(null);
  const removeRef = useRef<(() => void) | null>(null);

  const drawOnHover = () => {
    const { wipe, remove } = drawHighlight(markRef.current, {
      instant: !!reduce,
    });
    wipeRef.current = wipe;
    removeRef.current = remove;
  };
  const wipeOnLeave = () => {
    wipeRef.current?.();
    wipeRef.current = null;
  };
  // Instant cleanup on unmount (e.g. when filtered out) so no rough-notation
  // observers leak.
  useEffect(() => () => removeRef.current?.(), []);

  const { frontmatter, slug, images, basePath, span, type } = item;
  const tier = TIER[span];
  // Type badge — a filled pill keyed to the type. Comparable neutrals from the
  // monochrome palette (no new hues): case study reads stronger (inverted dark),
  // play softer (light surface), so the two feel like one set.
  const typeBadge =
    type === "projects"
      ? "bg-fg text-canvas"
      : "border border-hairline text-fg";
  // Leading glyph keyed to type: bookmark = Project, flask = Experiment.
  const TypeIcon = type === "projects" ? Bookmark : FlaskSolid;
  const ratio = `${tier.w} / ${tier.h}`;

  // Resolve media: the first still is the poster/image; the first .mp4 (if any,
  // e.g. a curated `cover`) makes this a motion tile. cover overrides images[]
  // upstream, so scanning images[] finds both.
  const still = images.find((s) => !isVideo(s)) ?? frontmatter.thumbnail;
  const video = images.find(isVideo);
  // A gif thumbnail gets a lightweight static facade (same path, `-poster.jpg`)
  // so the tile shows a still instantly while the heavy gif downloads.
  const stillPoster =
    still && /\.gif(\?|$)/i.test(still)
      ? still.replace(/\.gif(\?|$)/i, "-poster.jpg$1")
      : undefined;

  return (
    <Link
      href={`${basePath}/${slug}`}
      className="group block no-underline"
      onMouseEnter={drawOnHover}
      onMouseLeave={wipeOnLeave}
      onClick={() =>
        posthog.capture("work_tile_clicked", {
          item_slug: slug,
          item_title: frontmatter.title,
          item_type: item.type,
        })
      }
    >
      {/* Media — flat, borderless. A 2% black veil rests over it and lifts on
          hover (the whole tile is the hover group). */}
      <div className="relative mb-4">
        {video ? (
          <video
            src={video}
            poster={still}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={`${frontmatter.title} preview`}
            className="w-full bg-surface-subtle object-cover"
            style={{ aspectRatio: ratio }}
          />
        ) : still ? (
          <ProgressiveImage
            src={still}
            poster={stillPoster}
            alt={frontmatter.title}
            width={tier.w}
            height={tier.h}
            sizes={tier.sizes}
            priority={priority}
          />
        ) : (
          <div
            className="w-full bg-surface-subtle"
            style={{ aspectRatio: ratio }}
          />
        )}
        <span
          aria-hidden
          style={{ backgroundColor: "rgb(0 0 0 / 0.02)" }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
        />
      </div>

      {/* Eyebrow — type badge (filled). */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-caption inline-flex items-center gap-1.5 px-2.5 py-1 ${typeBadge}`}
        >
          <TypeIcon aria-hidden width={14} height={14} strokeWidth={1.5} />
          {typeLabel}
        </span>
      </div>

      {/* Title — hand-drawn highlighter on hover (see ExperienceItem), not a dim.
          `hl-host` (position:relative) anchors rough-notation's absolutely-
          positioned SVG to THIS title, not the transformed RevealOnView wrapper —
          otherwise the marker's origin shifts when the reveal transform changes
          and it strays to the page's left edge. */}
      <h3 className="text-h3 mt-2 text-fg hl-host">
        <span ref={markRef} className="hl-mark">
          {frontmatter.title}
        </span>
      </h3>

      {/* Meta — status (Shipped/Concept) + tools + year, in that order.
          (disciplines live in the filter rail, not here). */}
      {(() => {
        const meta = [
          item.status && statusLabel ? statusLabel : null,
          ...item.tools,
          item.year,
        ].filter(Boolean);
        return meta.length > 0 ? (
          <p className="text-caption mt-3 text-fg-muted uppercase">
            {meta.join("  ·  ")}
          </p>
        ) : null;
      })()}
    </Link>
  );
}
