"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "iconoir-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { EASE_OUT, DURATION, DELAY } from "@/lib/motion";
import { flashHighlight } from "@/lib/highlight";

type Heading = { id: string; text: string; level: number };

/**
 * Flash the highlighter over `el` once it has SETTLED after a scroll-to. We must
 * wait for BOTH the smooth scroll to stop AND the heading's reveal to finish:
 * RevealBlock fades every heading in over ~2s the first time it enters view, and
 * drawing mid-reveal marks a faint, still-moving heading (the bug where sections
 * below the fold don't sweep). rAF-poll for scroll-idle + near-full opacity;
 * already-visible sections pass in a frame, freshly revealed ones wait out their
 * fade. Capped at 2.5s so it can't hang. Module scope so its DOM/time reads
 * aren't analysed as component render.
 */
function flashWhenSettled(el: HTMLElement) {
  const startedAt = performance.now();
  const step = (lastY: number, idleFrames: number) => {
    const y = window.scrollY;
    const idle = Math.abs(y - lastY) < 1 ? idleFrames + 1 : 0;
    const opacity = parseFloat(getComputedStyle(el).opacity || "1");
    if ((idle >= 3 && opacity >= 0.95) || performance.now() - startedAt > 2500) {
      flashHighlight(el);
      return;
    }
    requestAnimationFrame(() => step(y, idle));
  };
  requestAnimationFrame(() => step(window.scrollY, 0));
}

/**
 * Open scroll-spy outline sidebar. Tracks the article's h1–h3 (with ids from
 * rehype-slug) via an IntersectionObserver with a centered rootMargin, so the
 * heading nearest the viewport center is "active". Displays a ← Index backlink
 * at the top and lists active sections.
 */
export function SideDocumentTab({
  hidden = false,
  maxLevel = 3,
}: {
  hidden?: boolean;
  // Deepest heading level to list (2 = top-level categories only).
  maxLevel?: number;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();

  // The "← Back" backlink only belongs on a case-study/play detail page; on
  // other pages (e.g. About) the tab is a plain scroll-spy outline.
  const isDetail =
    pathname.startsWith("/project/case-study/") ||
    pathname.startsWith("/project/play/");
  // Fallback destination when there's no in-app history to return to (e.g. the
  // page was opened directly in a fresh tab or from an external link). Points to
  // home, since the /project index is unlinked from nav.
  const backTo = "/";
  const backLabel = t("back");

  // Prefer returning to wherever the user actually came from. When there's
  // in-app history we go back(); otherwise the Link's href navigates to the
  // fixed index. The href is kept so the control works without JS and exposes
  // a real destination to assistive tech / hover preview.
  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  // Jumping to a section must NOT create a history entry. A plain `#id` anchor
  // pushes one per click, so scrolling around a long article stacks up entries
  // and the Back button unwinds them one by one instead of leaving the page.
  // We scroll manually and reflect the hash with replaceState (no new entry),
  // so Back always returns to the previous page. Modified / non-primary clicks
  // keep their native behavior (open-in-new-tab, copy link).
  const handleTocClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    // Smoothly bring the section to the VERTICAL CENTRE of the viewport (not the
    // top). Reduced-motion jumps instantly.
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
    window.history.replaceState(window.history.state, "", `#${id}`);

    // Flash the highlighter over the section title once it has settled. Reduced
    // motion (instant scroll, no reveal) draws right away; otherwise wait out the
    // smooth scroll + heading reveal (see flashWhenSettled).
    if (reduce) {
      flashHighlight(el, true);
    } else {
      flashWhenSettled(el);
    }
  };

  useEffect(() => {
    if (hidden) return;

    let observer: IntersectionObserver | null = null;

    const handleUpdate = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("article :is(h1, h2, h3)"),
      ).filter((el) => el.id && Number(el.tagName.charAt(1)) <= maxLevel);

      setHeadings(
        nodes.map((el) => ({
          id: el.id,
          text: el.textContent ?? "",
          level: Number(el.tagName.charAt(1)),
        })),
      );

      if (nodes.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            );
          if (visible[0]) setActiveId(visible[0].target.id);
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
      );
      nodes.forEach((el) => observer!.observe(el));
    };

    const frameId = requestAnimationFrame(handleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hidden, maxLevel]);

  if (hidden || headings.length === 0) return null;

  return (
    <motion.nav
      aria-label="Table of contents"
      className="flex flex-col gap-6"
      // Supporting chrome — settles in LAST, after header and body. Shared
      // tokens (see src/lib/motion.ts); inert under reduced motion. Opacity ONLY
      // (no y-rise): the tab sits in a sticky column, so any entrance transform
      // reads as vertical drift as you scroll while it settles over ~2s.
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={
        reduce
          ? undefined
          : { duration: DURATION, ease: EASE_OUT, delay: DELAY.sideTab }
      }
    >
      {isDetail ? (
        <Link
          href={backTo}
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-body text-fg-muted no-underline transition-colors hover:text-fg"
        >
          <ArrowLeft width={16} height={16} aria-hidden />
          <span>{backLabel}</span>
        </Link>
      ) : null}
      <ul className="flex flex-col gap-3">
        {headings.map((h) => {
          const indent = h.level > 2 ? `${(h.level - 2) * 16}px` : "0px";
          return (
            <li key={h.id} style={{ paddingLeft: indent }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => handleTocClick(e, h.id)}
                className={`relative block text-body no-underline transition-colors ${
                  activeId === h.id ? "text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {/* Invisible bold sizer reserves the ACTIVE (heavier, wider-
                    wrapping) height for every item, so the list never reflows
                    vertically when the active weight toggles on scroll. The real
                    text overlays it; only its weight changes, never the box. */}
                <span aria-hidden className="invisible font-medium">
                  {h.text}
                </span>
                <span
                  className={`absolute inset-0 ${
                    activeId === h.id ? "font-medium" : ""
                  }`}
                >
                  {h.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
