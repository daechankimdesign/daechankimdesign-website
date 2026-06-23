"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LinkButton } from "./LinkButton";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";

interface CardProps {
  slug: string;
  frontmatter: ContentItem["frontmatter"];
  images: string[];
  detailsLabel: string;
}

function ProjectMeta({
  slug,
  frontmatter,
  detailsLabel,
}: {
  slug: string;
  frontmatter: ContentItem["frontmatter"];
  detailsLabel: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <h3 className="text-h2">{frontmatter.title}</h3>
      {frontmatter.tags && frontmatter.tags.length > 0 ? (
        <p className="text-caption mt-2 text-fg-muted">
          {frontmatter.tags.join("   ")}
        </p>
      ) : null}
      <div className="mt-3">
        <LinkButton href={`/project/${slug}`}>{detailsLabel}</LinkButton>
      </div>
    </div>
  );
}

/**
 * The title rides from the top of the project to a pinned left sidebar and stays
 * there until the project's images finish. It's a cross-fade between two copies
 * of the meta — a TOP copy (above the images, scrolls away) and a SIDEBAR copy
 * (left column, sticky). Only opacity/transform animate and the images live in
 * their own column, so nothing changes layout height during scroll (no kick).
 */
function FeaturedProjectCard({
  slug,
  frontmatter,
  images,
  detailsLabel,
}: CardProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPinned(mq.matches && entry.boundingClientRect.top < 136);
      },
      { rootMargin: "-136px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="relative pb-16 mb-16 hairline-b col-span-1 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 lg:gap-x-16">
      {/* Fires when the project top crosses the pin line (136px). */}
      <div
        ref={sentinelRef}
        className="absolute left-0 top-0 h-px w-full pointer-events-none opacity-0"
      />

      {/* Sidebar meta (desktop only): left column, pinned, cross-fades in once the
          top meta has scrolled to the pin line. Its grid cell stretches to the
          full project height so the sticky inner travels until the project ends. */}
      <div className="hidden lg:col-span-3 lg:col-start-1 lg:row-start-1 lg:block">
        <div
          aria-hidden={!pinned}
          className={`flex flex-col items-start transition-all duration-300 ease-out lg:sticky lg:top-[136px] ${
            pinned
              ? "opacity-100 translate-y-0"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <ProjectMeta
            slug={slug}
            frontmatter={frontmatter}
            detailsLabel={detailsLabel}
          />
        </div>
      </div>

      {/* Right column: the top meta (scrolls away, fades out once pinned) followed
          by the stacked images. */}
      <div className="flex flex-col gap-6 lg:col-span-9 lg:col-start-4">
        <div
          className={`transition-opacity duration-200 ${
            pinned ? "lg:opacity-0" : "opacity-100"
          }`}
        >
          <ProjectMeta
            slug={slug}
            frontmatter={frontmatter}
            detailsLabel={detailsLabel}
          />
        </div>

        {images && images.length > 0
          ? images.map((src, i) => (
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
            ))
          : null}
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
