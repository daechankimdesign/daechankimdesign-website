"use client";

import { createElement, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Long-form content reveal. Each MDX block fades up the first time it scrolls
 * into view (or immediately if already visible on load), so the body content
 * follows the same entrance motion as the hero cascade — just triggered per
 * block on scroll instead of all at once.
 *
 * Only opacity + transform animate, so there is no layout shift: every block
 * occupies its final space and merely fades/rises into it. Reduced-motion
 * renders the plain element, fully visible.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE } },
};

// Reveal slightly before the block is fully on-screen so it reads as settled by
// the time the reader reaches it, never lagging behind the scroll.
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

const TAGS = {
  div: motion.div,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  ul: motion.ul,
  ol: motion.ol,
  blockquote: motion.blockquote,
  hr: motion.hr,
} as const;

type Tag = keyof typeof TAGS;

export function RevealBlock({
  as = "div",
  children,
  ...rest
}: {
  as?: Tag;
  children?: ReactNode;
} & Record<string, unknown>) {
  const reduce = useReducedMotion();
  if (reduce) return createElement(as, rest, children);

  const M = TAGS[as];
  // Entrance (framer) sits on M; the position-based edge-fade dim sits on an
  // inner wrapper so the two opacities multiply. The wrapper goes INSIDE M (not
  // around it) so M keeps its own margins — no collapsing surprises. Wrapper tag
  // matches the content model: a phrasing span for text headings/paragraphs, a
  // div for blockquote/media. Lists (ul/ol) and rules (hr) ride along undimmed.
  let content: ReactNode = children;
  if (as === "p" || as === "h1" || as === "h2" || as === "h3") {
    content = <span className="edge-fade block">{children}</span>;
  } else if (as === "blockquote" || as === "div") {
    content = <div className="edge-fade">{children}</div>;
  }

  return (
    <M
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={VARIANTS}
      {...rest}
    >
      {content}
    </M>
  );
}
