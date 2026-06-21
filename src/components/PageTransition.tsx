"use client";

import { AnimatePresence, motion, usePresence } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useContext, useState } from "react";
import type { ReactNode } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
 * FrozenRouter freezes the LayoutRouterContext when the component starts exiting
 * (isPresent is false) so that the exiting page continues to render its old route
 * elements during transition rather than immediately updating to the new page.
 * When the component is active (isPresent is true), it lets the context updates
 * flow through so that Next.js doesn't freeze dynamic/loading routing states.
 */
export function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext ?? {});
  const [isPresent] = usePresence();
  const [frozenContext, setFrozenContext] = useState<typeof context>(context);
  const [prevContext, setPrevContext] = useState<typeof context>(context);

  if (isPresent && context !== prevContext) {
    setPrevContext(context);
    setFrozenContext(context);
  }

  const valueToProvide = isPresent ? context : (frozenContext ?? context);

  return (
    <LayoutRouterContext.Provider value={valueToProvide}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/**
 * Visual page transition: a full canvas slate slides in from the left or right
 * depending on the relative order of pages in the Universal Navigation, with page
 * contents appearing after a short delay on the plain slate. Exits are animated
 * concurrently via AnimatePresence with depth overlays.
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

  // Framer Motion variants for the slide-in slate background
  const slateVariants = {
    initial: (dir: "left" | "right") => ({
      x: isFirstLoad ? 0 : (dir === "right" ? "100%" : "-100%"),
      opacity: 1,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }, // Slipped duration synchronized to 1.2s
        opacity: { duration: 1.2 },
      }
    },
    exit: (dir: "left" | "right") => ({
      x: dir === "right" ? "-100%" : "100%", // Exits fully off-screen
      opacity: 1,
      zIndex: dir === "right" ? 0 : 10,
      transition: {
        x: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }, // Slipped exit duration remains 1.2s
        opacity: { duration: 1.2 },
      }
    })
  };

  // Framer Motion variants for the content appearance
  const contentVariants = {
    initial: {
      opacity: 0,
      y: 12
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 1, 0.5, 1] as const
      }
    },
    exit: {
      opacity: 0,
      y: -12,
      transition: {
        duration: 0.4, // Exit content fade-out
        ease: [0.25, 1, 0.5, 1] as const
      }
    }
  };

  return (
    <AnimatePresence custom={direction} mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        custom={direction}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={slateVariants}
        className="flex flex-1 flex-col bg-canvas relative overflow-hidden"
      >
        <motion.div 
          variants={contentVariants} 
          className="flex flex-1 flex-col"
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
