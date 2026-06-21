"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Unified page transition (rules §5): the whole page content slides in together
 * (transform/opacity only) — no per-element stagger. Used by
 * app/[locale]/template.tsx, which remounts on every navigation, so this plays
 * once per route. Kept gentle so the DisplayHeading's larger slide reads as one
 * cohesive motion rather than a competing one.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
