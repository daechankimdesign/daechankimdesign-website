"use client";

import { motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// Ordered navigation categories
const NAV_PATHS = [
  "/",
  "/project",
  "/sandbox",
  "/blog",
  "/about"
] as const;

function getPathIndex(path: string): number {
  const cleanPath = path.replace(/^\/(ko|es)(\/|$)/, "/").replace(/\/$/, "") || "/";
  const index = NAV_PATHS.findIndex((p) => 
    p === "/" ? cleanPath === "/" : cleanPath.startsWith(p)
  );
  return index !== -1 ? index : 0;
}

// Module-level variables to persist state across client-side navigations
let globalLastPathname: string | null = null;
let isInitialLoad = true;

/**
 * Visual page transition: a full canvas slate slides in from the left or right
 * depending on the relative order of pages in the Universal Navigation when a route
 * mounts. It runs as an entry-only transition to respect Next.js's native page
 * lifecycle, ensuring 100% stable content loading under all navigation patterns.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // 1. Calculate first load status
  const isFirstLoad = isInitialLoad;

  // 2. Calculate direction directly during the render phase
  let direction: "left" | "right" = "right";
  if (globalLastPathname && globalLastPathname !== pathname) {
    const prevIndex = getPathIndex(globalLastPathname);
    const currentIndex = getPathIndex(pathname);

    if (currentIndex > prevIndex) {
      direction = "right";
    } else if (currentIndex < prevIndex) {
      direction = "left";
    } else {
      // Sub-route navigation: compare path lengths
      const cleanPrev = globalLastPathname.replace(/^\/(ko|es)(\/|$)/, "/").replace(/\/$/, "") || "/";
      const cleanCurrent = pathname.replace(/^\/(ko|es)(\/|$)/, "/").replace(/\/$/, "") || "/";
      
      if (cleanCurrent.length > cleanPrev.length) {
        direction = "right";
      } else if (cleanCurrent.length < cleanPrev.length) {
        direction = "left";
      } else {
        direction = "right";
      }
    }
  }

  // Update tracking state after render
  useEffect(() => {
    if (isInitialLoad) {
      isInitialLoad = false;
    }
    globalLastPathname = pathname;
  }, [pathname]);

  // Framer Motion variants for the slide-in slate background (entry only)
  const slideVariants = {
    initial: (dir: "left" | "right") => ({
      x: isFirstLoad ? 0 : (dir === "right" ? "100%" : "-100%"),
    }),
    animate: {
      x: 0,
      transition: {
        x: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
      }
    }
  };

  const [transitioning, setTransitioning] = useState(false);

  return (
    <motion.div
      key={pathname}
      custom={direction}
      initial="initial"
      animate="animate"
      variants={slideVariants}
      onAnimationStart={() => setTransitioning(true)}
      onAnimationComplete={() => setTransitioning(false)}
      className={`flex flex-1 flex-col bg-canvas relative ${
        transitioning ? "overflow-hidden" : ""
      }`}
    >
      {children}
    </motion.div>
  );
}
