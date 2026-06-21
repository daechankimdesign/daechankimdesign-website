"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";
import { motion, AnimatePresence } from "framer-motion";

interface CardProps {
  slug: string;
  frontmatter: ContentItem["frontmatter"];
  images: string[];
  detailsLabel: string;
}

function FeaturedProjectCard({
  slug,
  frontmatter,
  images,
  detailsLabel,
}: CardProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    // Only apply sticky observer on desktop viewports (>= 1024px)
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!e.matches) {
        setIsSticky(false);
      }
    };

    handleMediaChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Detect when the article top crosses the sticky line (136px), i.e. the
    // header is pinning — shift the title left before the images reach it.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (mediaQuery.matches) {
          // Only set sticky if the sentinel is above the sticky line (136px)
          setIsSticky(entry.boundingClientRect.top < 136);
        } else {
          setIsSticky(false);
        }
      },
      {
        rootMargin: "-136px 0px 0px 0px", // 136px is our sticky top (below Projects title sticky top-24)
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  return (
    <article className="relative pb-16 hairline-b col-span-1 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-4 lg:gap-x-16 lg:gap-y-6">
      {/* Sentinel at the ARTICLE top: fires as the header begins to pin (while the
          images are still below it), so the title shifts left ahead of any overlap. */}
      <div
        ref={sentinelRef}
        className="absolute top-0 left-0 w-full h-px pointer-events-none opacity-0"
      />
      {/* Sticky Row Wrapper: Spans all 12 columns, sticks at top-36 (136px) on desktop */}
      <div className="col-span-1 lg:col-span-12 lg:sticky lg:top-[136px] z-10 pointer-events-none h-fit">
        <div className="flex flex-row items-start justify-between gap-x-6 gap-y-2 lg:grid lg:grid-cols-12 lg:gap-x-16 lg:gap-y-2 pointer-events-auto w-full">
          {/* Animated Title & Tags block */}
          <motion.div
            layout="position"
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 32,
              mass: 1,
            }}
            className={`col-span-1 flex flex-col ${
              isSticky
                ? "lg:col-span-3 lg:col-start-1"
                : "lg:col-span-6 lg:col-start-4"
            }`}
          >
            <motion.div layout="position" className="flex flex-col">
              <motion.h3 layout="position" className="text-h2">
                {frontmatter.title}
              </motion.h3>
              {frontmatter.tags && frontmatter.tags.length > 0 ? (
                <motion.p layout="position" className="text-caption mt-2 text-fg-muted">
                  {frontmatter.tags.join("   ")}
                </motion.p>
              ) : null}
            </motion.div>
          </motion.div>

          {/* Sticky Details Link: animates with slide-down, only visible in sticky state on desktop */}
          <AnimatePresence>
            {isSticky && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:block lg:col-span-3 lg:col-start-1 mt-2"
              >
                <Link
                  href={`/project/${slug}`}
                  className="text-body font-medium no-underline transition-opacity hover:opacity-60"
                >
                  {detailsLabel}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial Details Link: visible initially, fades out when isSticky is true */}
          <motion.div
            animate={{
              opacity: isSticky ? 0 : 1,
              pointerEvents: isSticky ? "none" : "auto",
            }}
            transition={{ duration: 0.2 }}
            className="col-span-1 lg:col-span-3 lg:col-start-10 flex items-start lg:justify-end"
          >
            <Link
              href={`/project/${slug}`}
              className="text-body font-medium no-underline transition-opacity hover:opacity-60"
            >
              {detailsLabel}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Stacked Images (stable layout positioning) */}
      <div className="relative col-span-1 lg:col-span-9 lg:col-start-4 flex flex-col gap-6 mt-8 lg:mt-16">
        {images && images.length > 0 ? (
          <>
            {images.map((src, i) => (
              <Link
                key={src}
                href={`/project/${slug}`}
                className="block no-underline overflow-hidden rounded-md border border-hairline transition-transform duration-300 hover:scale-[1.005]"
              >
                <ProgressiveImage
                  src={src}
                  alt={`${frontmatter.title} preview ${i + 1}`}
                  width={1600}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 1680px"
                  className="w-full object-cover aspect-[16/9] rounded-md"
                />
              </Link>
            ))}
          </>
        ) : null}
      </div>
    </article>
  );
}

export function FeaturedProjects({
  items,
  detailsLabel,
}: {
  items: ContentItem[];
  detailsLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-body text-fg-muted col-span-1 lg:col-span-9 lg:col-start-4">
        No projects yet.
      </p>
    );
  }

  return (
    <>
      {items.map(({ slug, frontmatter, images }) => (
        <FeaturedProjectCard
          key={slug}
          slug={slug}
          frontmatter={frontmatter}
          images={images}
          detailsLabel={detailsLabel}
        />
      ))}
    </>
  );
}
