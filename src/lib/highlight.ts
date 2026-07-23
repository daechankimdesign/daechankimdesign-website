"use client";

import { annotate } from "rough-notation";

/**
 * The site's hand-drawn highlighter, in one place. The hero sub-text marker
 * ([Highlighter] in HeroHeadline), the on-demand section flash (side document
 * tab), and the About experience-header hover all read as the SAME mark by
 * sharing these settings.
 *
 * The alpha lives in the COLOUR (not a flat SVG opacity) so rough-notation's
 * overlapping strokes compound to a denser marker where they cross.
 *
 * THEME NOTE: the RENDERED colour is the CSS variable --hl (globals.css theme
 * blocks; a quieter gold in dark mode). A global stroke rule overrides the
 * presentation attribute rough-notation writes, so marks recolour live on
 * theme change. This constant is only the pre-CSS fallback the library
 * requires; keep it equal to the light theme's --hl.
 */
export const HL_COLOR = "rgba(253, 231, 105, 0.55)";

/** Shared rough-notation marker settings (colour + stroke character). */
export const HL_MARK = {
  color: HL_COLOR,
  strokeWidth: 1.5,
  iterations: 2,
  padding: 2,
} as const;

// Lifecycle (ms): sketch the mark in, (flash only) hold it, wipe out left→right.
const DRAW_MS = 700;
const HOLD_MS = 1000;
const WIPE_MS = 350;

type Annotation = ReturnType<typeof annotate>;
type Handle = {
  target: HTMLElement;
  annotation: Annotation;
  timers: ReturnType<typeof setTimeout>[];
  instant: boolean;
  done: boolean;
};

// At most one live highlight per target element; a fresh draw cancels the old.
const live = new WeakMap<HTMLElement, Handle>();

const resolveTarget = (el: HTMLElement) =>
  el.querySelector<HTMLElement>(".hl-mark") ?? el;

// Remove the mark instantly and forget the handle.
function clearNow(handle: Handle) {
  if (handle.done) return;
  handle.done = true;
  handle.timers.forEach(clearTimeout);
  live.delete(handle.target);
  try {
    handle.annotation.remove();
  } catch {
    /* SVG already detached — nothing to do. */
  }
}

// Wipe the mark out left→right, then remove. For `highlight`, rough-notation
// inserts its `<svg class="rough-annotation">` immediately BEFORE the target, so
// the previous sibling is a reliable handle. The svg is a fixed 100×100 box with
// overflow:visible and the mark is painted at the target's coordinates OUTSIDE
// that box (and the box can shift after draw), so DON'T clip from the box's
// screen position — read the painted PATHS' bounds via getBBox() (the svg's own
// pixel space, exactly what clip-path inset() uses) and sweep the LEFT edge
// across them, keeping top/right/bottom far outside the paint.
function wipeOut(handle: Handle) {
  if (handle.done) return;
  const svg = handle.target.previousElementSibling;
  if (
    !handle.instant &&
    svg instanceof SVGSVGElement &&
    svg.classList.contains("rough-annotation")
  ) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of Array.from(svg.querySelectorAll("path"))) {
      const b = p.getBBox();
      if (b.width || b.height) {
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x + b.width);
      }
    }
    if (Number.isFinite(minX)) {
      const open = "-2000px"; // top/right/bottom — never clip these
      svg.style.clipPath = `inset(${open} ${open} ${open} ${minX - 6}px)`;
      void svg.getBoundingClientRect(); // commit the start frame
      svg.style.transition = `clip-path ${WIPE_MS}ms ease`;
      svg.style.clipPath = `inset(${open} ${open} ${open} ${maxX + 6}px)`;
      handle.timers.push(setTimeout(() => clearNow(handle), WIPE_MS));
      return;
    }
  }
  clearNow(handle);
}

/**
 * Draw the highlighter over `el` (or an inner `.hl-mark`, for a snug text-width
 * mark) and keep it until told otherwise. Returns imperative controls:
 * `wipe()` runs the left→right exit animation then removes; `remove()` clears
 * instantly. `instant` skips the sketch animation (reduced motion). A fresh draw
 * cancels any highlight already live on the same target, so nothing leaks.
 *
 * Use this for a held highlight (e.g. draw on hover-in, wipe on hover-out).
 */
export function drawHighlight(
  el: HTMLElement | null,
  opts: { instant?: boolean } = {},
): { wipe: () => void; remove: () => void } {
  if (!el) return { wipe: () => {}, remove: () => {} };
  const instant = opts.instant ?? false;
  const target = resolveTarget(el);

  const prev = live.get(target);
  if (prev) clearNow(prev);

  const annotation = annotate(target, {
    type: "highlight",
    multiline: true,
    animate: !instant,
    animationDuration: DRAW_MS,
    ...HL_MARK,
  });
  annotation.show();

  const handle: Handle = { target, annotation, timers: [], instant, done: false };
  live.set(target, handle);
  return {
    wipe: () => wipeOut(handle),
    remove: () => clearNow(handle),
  };
}

/**
 * One-shot flash (side document tab): draw the mark, hold ~HOLD_MS, then wipe it
 * out left→right. Built on drawHighlight so it reads identically to the hover
 * highlight — it just auto-wipes after the hold instead of on pointer-out.
 */
export function flashHighlight(el: HTMLElement | null, instant = false): void {
  if (!el) return;
  const target = resolveTarget(el);
  const { wipe } = drawHighlight(el, { instant });
  live.get(target)?.timers.push(setTimeout(wipe, DRAW_MS + HOLD_MS));
}
