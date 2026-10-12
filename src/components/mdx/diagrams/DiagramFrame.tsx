"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "framer-motion";
import "./diagram.css";

// Same trigger as ImageFrame / ScreenSet: settle just before the block is fully
// on-screen, once.
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

/**
 * The shared frame for MDX diagrams, and the `data-shown` switch that starts
 * the CSS build-up (diagram.css) when the diagram scrolls into view.
 *
 * Deliberately plain: no panel and no caption. A diagram is part of the case
 * study's own text, not an exhibit set apart like an image, so it sits
 * straight on the page and must read on its own, with every label inside it.
 */
export function DiagramFrame({ children, className = "my-10" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInView(ref, VIEWPORT);
  return (
    <div ref={ref} className={`dg ${className}`} data-shown={shown ? "true" : "false"}>
      {children}
    </div>
  );
}
