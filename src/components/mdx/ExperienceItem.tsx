"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavArrowDown } from "iconoir-react";
import { useReducedMotion } from "framer-motion";
import { drawHighlight } from "@/lib/highlight";

/**
 * Collapsible experience entry for the About page (used from about.mdx). Collapsed,
 * it shows only the role title + `location · date` meta; clicking the header
 * reveals the bullet body. The open/close is a CSS grid-rows transition (0fr→1fr)
 * so there's no height measurement, and the body stays mounted the whole time —
 * its scroll-reveal plays once while collapsed, never as a slow fade on open. A
 * NavArrowDown (iconoir) chevron rotates to point up when open.
 *
 * Hover state: the title gets the shared hand-drawn highlighter (the same mark
 * the side tab flashes on a navigated section) — drawn on pointer-in, wiped out
 * left→right on pointer-out — instead of a plain opacity dim.
 */
export function ExperienceItem({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
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

  return (
    <div className="border-b border-hairline">
      {/* Header — the whole row toggles; wrapped in an h3 for document outline. */}
      <h3 className="text-h3 m-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={drawOnHover}
          onMouseLeave={wipeOnLeave}
          aria-expanded={open}
          className="flex w-full items-start justify-between gap-4 py-4 text-left"
        >
          {/* `hl-host` (position:relative) anchors rough-notation's SVG to this
              box, not the transformed RevealBlock wrapper, so the marker can't
              stray if the reveal transform changes. */}
          <span className="hl-host min-w-0">
            <span ref={markRef} className="hl-mark">
              {title}
            </span>
            {meta ? (
              <span className="text-caption mt-1 block font-normal text-fg-muted">
                {meta}
              </span>
            ) : null}
          </span>
          <NavArrowDown
            aria-hidden
            width={18}
            height={18}
            className={`mt-1 shrink-0 text-fg-muted transition-transform duration-300 ease-out ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>

      {/* Body — grid-rows animates the height without measuring; the inner
          overflow-hidden clips while collapsed. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
