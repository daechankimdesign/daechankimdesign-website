"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Click-to-zoom viewport. Wraps content (a ProgressiveImage, in practice) in a
 * fixed-size clipping frame; a click or tap toggles a magnified view focused on
 * the clicked point, and while zoomed the focus pans to follow the pointer so
 * different regions can be inspected. Click/tap again to zoom back out.
 *
 * WHY A WRAPPER, not a replacement: ProgressiveImage owns a careful blur-up +
 * next/image crossfade. This only transforms the element from OUTSIDE, so the
 * loading behavior, the flat image-frame look, and the aspect box are all
 * untouched. The frame's size comes entirely from the child.
 *
 * The zoom and pan are applied imperatively (transform on the inner element,
 * transform-origin per animation frame), so React state holds only the on/off
 * toggle that drives the cursor — a pointer sweep never re-renders. The scale
 * transition is dropped under prefers-reduced-motion (the zoom snaps instead of
 * animating). It works on any pointer, touch included, because the trigger is an
 * explicit click rather than hover.
 *
 * Pure enhancement: the full image is always visible unzoomed and nothing is
 * hidden, so this deliberately adds no keyboard tab stop of its own.
 */
export function ClickZoom({
  children,
  zoomScale = 2,
  className,
}: {
  children: ReactNode;
  /** Magnification when zoomed in. */
  zoomScale?: number;
  className?: string;
}) {
  // State drives ONLY the cursor affordance; the transform is set imperatively so
  // a pan never re-renders and a re-render never fights the imperative transform.
  const [zoomed, setZoomed] = useState(false);
  const [reduce, setReduce] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  const setOrigin = (clientX: number, clientY: number) => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    const r = frame.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 100;
    const y = ((clientY - r.top) / r.height) * 100;
    inner.style.transformOrigin = `${x}% ${y}%`;
  };

  const handleClick = (e: React.MouseEvent) => {
    const next = !zoomed;
    // Focus the new zoom on the click point before scaling in.
    if (next) setOrigin(e.clientX, e.clientY);
    if (innerRef.current) {
      innerRef.current.style.transform = next ? `scale(${zoomScale})` : "scale(1)";
    }
    setZoomed(next);
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!zoomed) return;
    const { clientX, clientY } = e;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setOrigin(clientX, clientY));
  };

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"} ${className ?? ""}`}
      onClick={handleClick}
      onMouseMove={handleMove}
    >
      <div
        ref={innerRef}
        className={`will-change-transform ${reduce ? "" : "transition-transform duration-300 ease-out"}`}
      >
        {children}
      </div>
    </div>
  );
}
