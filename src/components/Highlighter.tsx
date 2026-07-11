"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { annotate } from "rough-notation";
import type { RoughAnnotationType } from "rough-notation/lib/model";

/**
 * Magic UI Highlighter — https://magicui.design/docs/components/highlighter
 *
 * A thin wrapper over rough-notation that draws a hand-sketched annotation
 * (highlight, underline, box, …) over its children and redraws it on resize.
 *
 * Deviation from the upstream `isView` prop: rough-notation measures the
 * element's box when it draws, so it MUST run after the target has settled (no
 * in-flight transform / opacity). We expose a controlled `active` gate instead,
 * so a caller can defer the draw until its own entrance animation has finished.
 */
export interface HighlighterProps {
  children: ReactNode;
  action?: RoughAnnotationType;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  // number, [vertical, horizontal], or [top, right, bottom, left]. Negative
  // vertical values thin the highlight band (rough-notation fills box + padding).
  padding?: number | [number, number] | [number, number, number, number];
  multiline?: boolean;
  /** Draw the annotation only once this is true (default: draw on mount). */
  active?: boolean;
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  active = true,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!active) return;
    const element = elementRef.current;
    if (!element) return;

    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    });
    annotation.show();

    // rough-notation positions its SVG from a one-time measurement; re-measure
    // when the element or the page reflows so the mark stays aligned.
    const redraw = () => {
      annotation.hide();
      annotation.show();
    };
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(element);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      annotation.remove();
    };
  }, [
    active,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
  ]);

  return (
    <span ref={elementRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  );
}
