"use client";

import { annotate } from "rough-notation";

/**
 * The site's hand-drawn highlighter, in one place. Both the hero sub-text marker
 * ([Highlighter] in HeroHeadline) and the on-demand section flash fired from the
 * side document tab read as the SAME mark by sharing these settings.
 *
 * The alpha lives in the COLOUR (not a flat SVG opacity) so rough-notation's
 * overlapping strokes compound to a denser marker where they cross.
 */
export const HL_COLOR = "rgba(253, 231, 105, 0.55)";

/** Shared rough-notation marker settings (colour + stroke character). */
export const HL_MARK = {
  color: HL_COLOR,
  strokeWidth: 1.5,
  iterations: 2,
  padding: 2,
} as const;

// Flash lifecycle (ms): sketch the mark in, hold it, wipe it out left→right,
// remove. "Draw for ~a second, gone the next" — tune here.
const DRAW_MS = 700;
const HOLD_MS = 1000;
const WIPE_MS = 350;

// At most one transient flash per target element; a fresh flash cancels the old
// one (rapid re-clicks, or re-clicking the section that's already flashing).
const active = new WeakMap<HTMLElement, () => void>();

/**
 * Draw the highlighter over `el` (or an inner `.hl-mark` if present, for a snug
 * text-width mark), then clear it: it sketches in over ~DRAW_MS, holds ~HOLD_MS,
 * wipes out left→right over ~WIPE_MS, and is removed. `instant` skips the sketch
 * animation (reduced motion). Safe to call repeatedly — any flash already
 * running on the same target is cancelled first, so nothing leaks.
 */
export function flashHighlight(el: HTMLElement | null, instant = false): void {
  if (!el) return;
  const target = el.querySelector<HTMLElement>(".hl-mark") ?? el;

  // Cancel a flash already running on this target before starting a new one.
  active.get(target)?.();

  const annotation = annotate(target, {
    type: "highlight",
    multiline: true,
    animate: !instant,
    animationDuration: DRAW_MS,
    ...HL_MARK,
  });
  annotation.show();

  const timers: ReturnType<typeof setTimeout>[] = [];
  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    active.delete(target);
    try {
      annotation.remove();
    } catch {
      /* SVG already detached — nothing to do. */
    }
  };

  // Hold, then wipe the mark out left→right. For `highlight`, rough-notation
  // inserts its `<svg class="rough-annotation">` immediately BEFORE the target,
  // so the previous sibling is a reliable handle.
  timers.push(
    setTimeout(() => {
      const svg = target.previousElementSibling;
      if (
        !instant &&
        svg instanceof SVGSVGElement &&
        svg.classList.contains("rough-annotation")
      ) {
        // The svg is a fixed 100×100 box with overflow:visible; the mark is
        // painted at the target's coordinates OUTSIDE that box, and the box can
        // even shift between draw and wipe (a section still finishing its
        // scroll-in reveal changes its containing block). So DON'T derive the
        // clip from the box's screen position — read the painted PATHS' bounds
        // via getBBox(), which are in the svg's own pixel space, exactly what
        // clip-path inset() uses. Sweep the LEFT edge across that span, keeping
        // top/right/bottom far outside the paint so only the wipe clips.
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
          const x0 = minX - 6; // just left of the mark
          const x1 = maxX + 6; // just past its right edge
          svg.style.clipPath = `inset(${open} ${open} ${open} ${x0}px)`;
          void svg.getBoundingClientRect(); // commit the start frame
          svg.style.transition = `clip-path ${WIPE_MS}ms ease`;
          svg.style.clipPath = `inset(${open} ${open} ${open} ${x1}px)`;
          timers.push(setTimeout(cleanup, WIPE_MS));
        } else {
          cleanup();
        }
      } else {
        cleanup();
      }
    }, DRAW_MS + HOLD_MS),
  );

  active.set(target, cleanup);
}
