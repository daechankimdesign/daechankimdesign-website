"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Display heading (rules §5): a one-time slide-in from the bottom on mount,
 * with a slide-up exit. transform/opacity only. Sits within PageTransition,
 * sharing its easing so the two read as one cohesive entrance, not a conflict.
 */
export function DisplayHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.h1
      className={`text-display ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.h1>
  );
}
