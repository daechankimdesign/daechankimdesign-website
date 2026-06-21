"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";

const NAV = [
  { href: "/", key: "home" },
  { href: "/project", key: "projects" },
  { href: "/sandbox", key: "sandbox" },
  { href: "/blog", key: "blogs" },
  { href: "/about", key: "about" },
] as const;

// How far the user scrolls before the pill leaves the top and docks at the
// bottom of the viewport.
const SCROLL_THRESHOLD = 80;

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

/** The transparent, hairline-bordered pill itself (shared by both positions). */
function NavPill() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  // pathname from next-intl is locale-stripped (e.g. "/project/foo").
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1 rounded-full border border-hairline px-1.5 py-1 backdrop-blur-md"
    >
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 text-body no-underline transition-colors sm:px-4 ${
            isActive(item.href)
              ? "bg-surface text-fg"
              : "text-fg-muted hover:text-fg"
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Universal navigation, separate from the top bar. It rides at the top within
 * the first fold, then — once the user scrolls past the threshold — slides up
 * and out and re-enters docked just above the bottom of the viewport.
 */
export function UniversalNav() {
  const [scrolled, setScrolled] = useState(false);
  // On phones the top pill would overlap the logo/right group, so the nav lives
  // at the bottom there (a tab-bar) regardless of scroll.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onMq = () => setIsMobile(mq.matches);
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onMq();
    onScroll();
    mq.addEventListener("change", onMq);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const docked = isMobile || scrolled;

  // inset-x-0 + mx-auto + w-max centers horizontally without a transform, so
  // framer-motion is free to own translateY for the slide.
  return (
    <AnimatePresence initial={false}>
      {docked ? (
        <motion.div
          key="bottom"
          className="fixed inset-x-0 bottom-6 z-40 mx-auto w-max"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={spring}
        >
          <NavPill />
        </motion.div>
      ) : (
        <motion.div
          key="top"
          className="fixed inset-x-0 top-3 z-40 mx-auto w-max"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={spring}
        >
          <NavPill />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
