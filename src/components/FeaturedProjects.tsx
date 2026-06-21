import { Link } from "@/i18n/navigation";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";

/** Home "Projects" section — each project as a featured block with a large
 *  preview image, title, tags, and a Details link to the case study. */
export function FeaturedProjects({
  items,
  detailsLabel,
}: {
  items: ContentItem[];
  detailsLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-body text-fg-muted">No projects yet.</p>;
  }

  return (
    <div className="flex flex-col gap-20">
      {items.map(({ slug, frontmatter }) => (
        <article key={slug}>
          <div className="mb-6 flex items-start justify-between gap-6">
            <div>
              <h3 className="text-h2">{frontmatter.title}</h3>
              {frontmatter.tags && frontmatter.tags.length > 0 ? (
                <p className="text-caption mt-2 text-fg-muted">
                  {frontmatter.tags.join("   ")}
                </p>
              ) : null}
            </div>
            <Link
              href={`/project/${slug}`}
              className="shrink-0 text-body font-medium no-underline transition-opacity hover:opacity-60"
            >
              {detailsLabel}
            </Link>
          </div>
          {frontmatter.thumbnail ? (
            <Link href={`/project/${slug}`} className="block no-underline">
              <ProgressiveImage
                src={frontmatter.thumbnail}
                alt={frontmatter.title}
                width={1600}
                height={900}
                sizes="(max-width: 1024px) 100vw, 1680px"
                className="rounded-md"
              />
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}
