"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";

/**
 * Sandbox shown as a horizontal carousel. On capable displays it scroll-jacks:
 * a tall wrapper pins the section to the viewport, and vertical scroll progress
 * is mapped 1:1 to horizontal translate — so the carousel advances as part of
 * the page scroll, then vertical scrolling resumes once it's exhausted. Because
 * the offset is derived from scroll *position* (not wheel events), scrolling
 * back up reverses it smoothly and re-entering mid-way just works.
 *
 * While the section is pinned, a predominantly-horizontal wheel/trackpad gesture
 * is also captured and folded into the same page scroll, so swiping sideways
 * advances the carousel just like scrolling down does (and it suppresses the
 * browser's horizontal back/forward overscroll while engaged). Falls back to a
 * native horizontal scroll strip under prefers-reduced-motion.
 */
// Pinned dwell (in viewport-heights) before the slide begins and after it ends,
// giving room to scroll into and out of the horizontal carousel.
const LEAD = 0.5;
const TAIL = 0.5;

export function SandboxCarousel({
  items,
  heading,
}: {
  items: ContentItem[];
  heading: string;
}) {
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    let raf = 0;
    let maxX = 0;
    let lead = 0;

    const update = () => {
      raf = 0;
      const top = wrapper.getBoundingClientRect().top;
      // Hold for `lead` px, slide over maxX, then hold again for the tail.
      const moved = Math.min(maxX, Math.max(0, -top - lead));
      track.style.transform = `translate3d(${-moved}px,0,0)`;
    };

    const measure = () => {
      // Horizontal overflow of the track past the visible (viewport) width.
      maxX = Math.max(0, track.scrollWidth - track.clientWidth);
      lead = window.innerHeight * LEAD;
      const tail = window.innerHeight * TAIL;
      // 1 viewport to pin + lead dwell + maxX slide + tail dwell.
      wrapper.style.height = `${window.innerHeight + lead + maxX + tail}px`;
      update();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Fold horizontal swipes into the page scroll the carousel derives from, but
    // only while the section is pinned to the viewport, and only when the gesture
    // is predominantly horizontal (vertical scroll already works natively). This
    // is non-passive so it can preventDefault the browser's back/forward
    // overscroll while we consume the gesture.
    const onWheel = (e: WheelEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const pinned = rect.top <= 0 && rect.bottom >= window.innerHeight;
      if (!pinned) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      window.scrollBy(0, e.deltaX);
      e.preventDefault();
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    wrapper.addEventListener("wheel", onWheel, { passive: false });
    // Re-measure once thumbnails/fonts settle and can change track width.
    const settle = window.setTimeout(measure, 400);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      wrapper.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, [reduce, items.length]);

  const cards = items.map(({ slug, frontmatter }) => (
    <Link
      key={slug}
      href={`/sandbox/${slug}`}
      className="edge-fade group block w-[80vw] shrink-0 no-underline sm:w-[460px]"
    >
      {frontmatter.thumbnail ? (
        <ProgressiveImage
          src={frontmatter.thumbnail}
          alt={frontmatter.title}
          width={1600}
          height={1600}
          sizes="(max-width: 640px) 80vw, 460px"
          className="mb-4 rounded-md"
        />
      ) : null}
      <h3 className="text-h3 text-fg transition-opacity group-hover:opacity-60">
        {frontmatter.title}
      </h3>
      {frontmatter.tags && frontmatter.tags.length > 0 ? (
        <p className="text-caption mt-1 text-fg-muted">
          {frontmatter.tags.join("  ·  ")}
        </p>
      ) : null}
    </Link>
  ));

  // Accessible fallback: a plain, natively scrollable horizontal strip.
  if (reduce) {
    return (
      <section className="py-16">
        <div className="container-page mb-8">
          <h3 className="text-h3">{heading}</h3>
        </div>
        <div className="flex gap-6 overflow-x-auto ps-6 sm:ps-12 lg:ps-24">
          {cards}
          {/* Trailing breathing room so the last card isn't flush to the edge. */}
          <div aria-hidden className="shrink-0 w-6 sm:w-12 lg:w-24" />
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapperRef} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-page mb-8">
          <h3 className="text-h3">{heading}</h3>
        </div>
        <div
          ref={trackRef}
          className="flex w-full gap-6 ps-6 will-change-transform sm:ps-12 lg:ps-24"
        >
          {cards}
          {/* Trailing spacer — a real flex child, not padding: the w-full track's
              right padding falls inside the overflowing content, so it never
              creates space after the last card. This does, and it's counted in
              scrollWidth so the extra slide distance is scrolled through. */}
          <div aria-hidden className="shrink-0 w-6 sm:w-12 lg:w-24" />
        </div>
      </div>
    </section>
  );
}
