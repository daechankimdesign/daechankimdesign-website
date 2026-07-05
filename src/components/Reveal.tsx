"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT, DURATION, STAGGER, DELAY } from "@/lib/motion";

/**
 * Entrance reveal — the on-load sequence from the reference site: the nav is
 * already present, then the hero content group fades up together, top-to-bottom,
 * with a brief hold and an ease-out settle (fast start, slow finish).
 *
 * `Reveal` is the stagger container; wrap each line/block in a `RevealItem`. The
 * cascade reads as one cohesive entrance rather than N independent animations.
 * Shares the project's standard easing ([0.22, 1, 0.36, 1]) so it sits with the
 * existing DisplayHeading / page-transition motion.
 *
 * Reduced-motion: the whole thing renders inert (content simply present).
 */

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      // Header appears first (shortest delay); a gentle top-to-bottom cascade.
      // Shared tokens — see src/lib/motion.ts.
      delayChildren: DELAY.header,
      staggerChildren: STAGGER,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION, ease: EASE_OUT },
  },
};

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

/**
 * Section-level reveal triggered when the block scrolls into view (once). Use to
 * bring whole page sections in as the reader reaches them.
 *
 * `rise` defaults to a fade-up (opacity + translateY). Pass `rise={false}` for
 * sections that contain `position: sticky` or scroll-jacked children — a
 * transformed ancestor would break sticky and skew getBoundingClientRect math,
 * so those fade in on opacity alone (no transform ever applied).
 */
export function RevealOnView({
  children,
  className,
  rise = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  rise?: boolean;
  // Extra hold before this section reveals. Use to sequence a section behind the
  // hero when it's already in view on load (otherwise whileInView fires at once).
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={rise ? { opacity: 0, y: 24 } : { opacity: 0 }}
      whileInView={rise ? { opacity: 1, y: 0 } : { opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DURATION, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

// Element tags a RevealItem can render as (kept small; extend as needed).
const TAGS = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
  span: motion.span,
} as const;

export function RevealItem({
  as = "div",
  children,
  className,
}: {
  as?: keyof typeof TAGS;
  children: ReactNode;
  className?: string;
}) {
  const Comp = TAGS[as];
  // Entrance (framer opacity/transform) lives on Comp; the edge-fade dim lives
  // on the inner wrapper. Separate elements → the opacities multiply, so a block
  // enters dimmed from the bottom and brightens as it clears the band.
  return (
    <Comp className={className} variants={item}>
      <span className="edge-fade block">{children}</span>
    </Comp>
  );
}
