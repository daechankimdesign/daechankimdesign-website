"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Ink, pen, roundedRect, sketchLine, sketchPath, sketchRect } from "./sketch";

/**
 * A hand-drawn shape that fills its parent (position the parent `relative`):
 * a rounded box around a step, a pill around a short item, an arrow between
 * steps (vertical or horizontal), a vertical divider, a marker bar, or a
 * list bullet. Drawn
 * at the parent's measured size, so corners and hatching keep their
 * proportions at any width, and redrawn on resize.
 */
export function SketchFrame({
  shape,
  seed,
  i = 0,
  variant,
  color,
}: {
  shape: "box" | "pill" | "arrow" | "arrow-h" | "vline" | "bar" | "dash";
  seed: number;
  i?: number;
  /** box: "blind" = hatching with no outline; "mark" = marker-filled. */
  variant?: "blind" | "mark";
  /** bar: the marker colour. */
  color?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  let ink = null;
  if (w > 0 && h > 0) {
    if (shape === "box" || shape === "pill") {
      const d = roundedRect(3, 3, w - 6, h - 6, shape === "pill" ? (h - 6) / 2 : Math.min(14, h / 4));
      if (variant === "blind") {
        ink = <Ink i={i} fill="text-fg-subtle" d={sketchPath(d, pen({ seed, stroke: "none", fill: "currentColor", fillStyle: "hachure", hachureGap: 11, fillWeight: 0.6, hachureAngle: -45 }))} />;
      } else if (variant === "mark") {
        // The marker colour is translucent: a solid pass of it, with the
        // hatching drawn over, reads as a marker stroke (as in PhaseFunnel).
        ink = (
          <>
            <Ink i={i} fill="text-[var(--hl)]" d={sketchPath(d, pen({ seed: seed + 50, stroke: "none", fill: "currentColor", fillStyle: "solid" }))} />
            <Ink i={i} fill="text-[var(--hl)]" d={sketchPath(d, pen({ seed, fill: "currentColor", fillStyle: "hachure", hachureGap: 5, fillWeight: 2, hachureAngle: -30 }))} />
          </>
        );
      } else {
        ink = <Ink i={i} d={sketchPath(d, pen({ seed }))} />;
      }
    } else if (shape === "arrow") {
      const x = w / 2;
      const o = pen({ seed, strokeWidth: 0.85, roughness: 0.9 });
      ink = (
        <>
          <Ink i={i} line="text-fg-muted" d={sketchLine(x, 3, x + 1, h - 4, o)} />
          <Ink i={i} line="text-fg-muted" d={sketchLine(x - 5, h - 10, x + 1, h - 3, { ...o, seed: seed + 1 })} />
          <Ink i={i} line="text-fg-muted" d={sketchLine(x + 7, h - 10, x + 1, h - 3, { ...o, seed: seed + 2 })} />
        </>
      );
    } else if (shape === "arrow-h") {
      const y = h / 2;
      const o = pen({ seed, strokeWidth: 0.85, roughness: 0.9 });
      ink = (
        <>
          <Ink i={i} line="text-fg-muted" d={sketchLine(3, y, w - 4, y + 1, o)} />
          <Ink i={i} line="text-fg-muted" d={sketchLine(w - 10, y - 5, w - 3, y + 1, { ...o, seed: seed + 1 })} />
          <Ink i={i} line="text-fg-muted" d={sketchLine(w - 10, y + 7, w - 3, y + 1, { ...o, seed: seed + 2 })} />
        </>
      );
    } else if (shape === "dash") {
      // A list bullet: one short pen stroke across the middle.
      ink = <Ink i={i} line="text-fg-muted" d={sketchLine(1, h / 2, w - 1, h / 2 + 0.5, pen({ seed, strokeWidth: 1.2, roughness: 0.7 }))} />;
    } else if (shape === "vline") {
      ink = <Ink i={i} line="text-fg-subtle" d={sketchLine(w / 2, 0, w / 2, h, pen({ seed, strokeWidth: 1, roughness: 0.8 }))} />;
    } else {
      ink = (
        <g style={{ color }}>
          <Ink i={i} line="" fill="" d={sketchRect(2, h * 0.25, w - 4, h * 0.5, pen({ seed, stroke: "currentColor", fill: "currentColor", fillStyle: "zigzag", hachureGap: 3, fillWeight: 1.6, roughness: 1.4 }))} />
        </g>
      );
    }
  }
  return (
    <svg ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={w ? `0 0 ${w} ${h}` : undefined}>
      {ink}
    </svg>
  );
}
