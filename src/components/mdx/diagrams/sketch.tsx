import rough from "roughjs";
import type { Drawable, Options } from "roughjs/bin/core";
import type { CSSProperties } from "react";

/* ============================================================================
   Hand-drawn diagram ink (the `sketch` option on StepFlow, PhaseFunnel, and
   JourneyMap). rough.js's generator turns a shape into wobbly path data with
   no DOM, so a sketch renders on the server and stays the same on every load
   (each shape has a fixed seed). The outline draws in on scroll-in
   (.dg-draw); hatching and solid fills fade in after it (.dg-fade).
   ============================================================================ */

const gen = rough.generator();

/** A light pen: a little roughness and bowing, the line drawn once or twice. */
export const PEN: Options = { roughness: 1.1, bowing: 1.2, strokeWidth: 0.85 };

export const pen = (extra: Options): Options => ({ ...PEN, ...extra });

/** A rounded rectangle as a path, so its corners wobble like the sides. */
export function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  return [
    `M${x + k},${y}`,
    `L${x + w - k},${y} Q${x + w},${y} ${x + w},${y + k}`,
    `L${x + w},${y + h - k} Q${x + w},${y + h} ${x + w - k},${y + h}`,
    `L${x + k},${y + h} Q${x},${y + h} ${x},${y + h - k}`,
    `L${x},${y + k} Q${x},${y} ${x + k},${y} Z`,
  ].join(" ");
}

export const sketchPath = (d: string, o: Options) => gen.path(d, o);
export const sketchLine = (x1: number, y1: number, x2: number, y2: number, o: Options) => gen.line(x1, y1, x2, y2, o);
export const sketchRect = (x: number, y: number, w: number, h: number, o: Options) => gen.rectangle(x, y, w, h, o);

/**
 * Renders one drawable. Colours come from CSS `color` (currentColor), so they
 * follow the theme: `line` colours the outline, `fill` the hatching or solid
 * fill. `i` is the build-up index shared with the other diagram parts.
 */
export function Ink({
  d,
  line = "text-fg",
  fill = "text-fg-muted",
  i = 0,
  style,
}: {
  d: Drawable;
  line?: string;
  fill?: string;
  i?: number;
  style?: CSSProperties;
}) {
  const at = { "--i": i, ...style } as CSSProperties;
  return (
    <>
      {d.sets.map((set, k) => {
        const path = gen.opsToPath(set, 2);
        if (set.type === "path") {
          return (
            <path
              key={k}
              d={path}
              pathLength={1}
              className={`dg-draw ${line}`}
              stroke="currentColor"
              strokeWidth={d.options.strokeWidth}
              strokeDasharray={d.options.strokeLineDash ? d.options.strokeLineDash.join(" ") : undefined}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={at}
            />
          );
        }
        if (set.type === "fillSketch") {
          return (
            <path
              key={k}
              d={path}
              className={`dg-fade ${fill}`}
              stroke="currentColor"
              strokeWidth={d.options.fillWeight}
              fill="none"
              strokeLinecap="round"
              style={at}
            />
          );
        }
        return <path key={k} d={path} className={`dg-fade ${fill}`} fill="currentColor" stroke="none" style={at} />;
      })}
    </>
  );
}

/** The pen face for a sketch's titles: the home page wall's handwriting. */
export const HAND = "font-[family-name:var(--font-hand)] font-normal leading-[0.95] text-fg";
