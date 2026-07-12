"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "iconoir-react";
import { useReducedMotion } from "framer-motion";
import { drawHighlight } from "@/lib/highlight";

/**
 * An About résumé entry (Award / Recognition), in the same title + muted-meta
 * format as the Education degrees. When `href` is set the whole entry becomes an
 * external link with a top-right ArrowUpRight (opens in a new tab), and hovering
 * draws the shared highlighter over the title — wiped out left→right on leave,
 * the same mark as the experience headers. Without `href`, it renders as plain
 * title + meta (no arrow, no hover mark), matching the unlinked degrees.
 */
export function AwardItem({
  title,
  meta,
  href,
}: {
  title: string;
  meta?: string;
  href?: string;
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
  // Instant cleanup on unmount so no rough-notation observers leak.
  useEffect(() => () => removeRef.current?.(), []);

  const body = (
    <>
      {/* `hl-host` (position:relative) anchors rough-notation's SVG to this box,
          not the transformed RevealBlock wrapper, so the marker stays put. */}
      <div className="hl-host min-w-0">
        <h3 className="text-h3 m-0">
          <span ref={markRef} className="hl-mark">
            {title}
          </span>
        </h3>
        {meta ? (
          <span className="text-caption mt-2 block font-normal text-fg-muted">
            {meta}
          </span>
        ) : null}
      </div>
      {href ? (
        <ArrowUpRight
          aria-hidden
          width={18}
          height={18}
          className="mt-1 shrink-0 text-fg-muted transition-colors group-hover:text-fg"
        />
      ) : null}
    </>
  );

  return (
    <div className="mt-8">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={drawOnHover}
          onMouseLeave={wipeOnLeave}
          className="group flex items-start justify-between gap-4 no-underline"
        >
          {body}
        </a>
      ) : (
        <div className="flex items-start justify-between gap-4">{body}</div>
      )}
    </div>
  );
}
