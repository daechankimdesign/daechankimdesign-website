"use client";

import { Link } from "@/i18n/navigation";
import { LinkButton } from "./LinkButton";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";

interface Props {
  slug: string;
  frontmatter: ContentItem["frontmatter"];
  images: string[];
  detailsLabel: string;
}

const isVideo = (src: string) => /\.mp4($|\?)/i.test(src);

function ProjectMeta({
  slug,
  frontmatter,
  detailsLabel,
}: Omit<Props, "images">) {
  return (
    <div className="flex flex-col items-start">
      <h3 className="text-h2">{frontmatter.title}</h3>
      {frontmatter.tags && frontmatter.tags.length > 0 ? (
        <p className="text-caption mt-2 text-fg-muted">
          {frontmatter.tags.join("   ")}
        </p>
      ) : null}
      <div className="mt-3">
        <LinkButton href={`/project/case-study/${slug}`} arrow="right">
          {detailsLabel}
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * One project in the Selected Work list: a plain vertical stack of its images
 * with a sticky meta column on the left (desktop), scrolling top-to-bottom with
 * the page on every screen. (This was previously a desktop-only 3D cover-flow
 * deck; reverted to this regular stack — the same layout small screens always
 * had — so the section reads consistently and scrolls freely. Name kept for a
 * stable import; the Sandbox still uses the underlying CoverFlow component.)
 */
export function ProjectCoverFlow({
  slug,
  frontmatter,
  images,
  detailsLabel,
}: Props) {
  return (
    <article className="relative pb-16 mb-16 hairline-b col-span-1 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 lg:gap-x-16">
      <div className="hidden lg:col-span-3 lg:col-start-1 lg:block">
        <div className="flex flex-col items-start lg:sticky lg:top-[151px]">
          <ProjectMeta
            slug={slug}
            frontmatter={frontmatter}
            detailsLabel={detailsLabel}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-9 lg:col-start-4">
        <div className="lg:hidden">
          <ProjectMeta
            slug={slug}
            frontmatter={frontmatter}
            detailsLabel={detailsLabel}
          />
        </div>

        {images.map((src, i) => (
          <Link
            key={src}
            href={`/project/case-study/${slug}`}
            className="edge-fade block no-underline overflow-hidden"
          >
            {isVideo(src) ? (
              <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={`${frontmatter.title} preview ${i + 1}`}
                className="w-full object-cover aspect-[16/9] bg-surface-subtle"
              />
            ) : (
              <ProgressiveImage
                src={src}
                alt={`${frontmatter.title} preview ${i + 1}`}
                width={1600}
                height={900}
                sizes="(max-width: 1024px) 100vw, 1680px"
                className="w-full object-cover aspect-[16/9]"
              />
            )}
          </Link>
        ))}
      </div>
    </article>
  );
}
