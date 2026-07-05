import { Link } from "@/i18n/navigation";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";

/**
 * Sandbox as a native horizontal scroll strip. A real `overflow-x` scroller
 * means trackpad/touch swipes scroll it natively (with momentum), and
 * `overscroll-behavior-x: contain` (`overscroll-x-contain`) keeps a sideways
 * swipe from chaining into Chrome's back/forward navigation — while leaving the
 * browser's back-swipe intact everywhere else on the site. No scroll-jacking, so
 * it never fights the browser; native scroll already respects reduced-motion.
 */
export function SandboxCarousel({
  items,
  heading,
}: {
  items: ContentItem[];
  heading: string;
}) {
  return (
    <section className="py-8">
      <div className="container-page mb-8">
        <h3 className="text-h3">{heading}</h3>
      </div>
      <div className="rail-aligned no-scrollbar flex gap-6 overflow-x-auto overscroll-x-contain ps-[var(--rail-inset)]">
        {items.map(({ slug, frontmatter }) => (
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
        ))}
        {/* Trailing spacer = the container inset, so scrolling to the end lands
            the last card's right edge on the page's right gutter. */}
        <div aria-hidden className="shrink-0 w-[var(--rail-inset)]" />
      </div>
    </section>
  );
}
