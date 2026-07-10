import { ProjectCoverFlow } from "./ProjectCoverFlow";
import type { ContentItem } from "@/lib/mdx";

/**
 * Featured (Selected Work) list. Each project renders as a plain vertical stack
 * of its images (see ProjectCoverFlow): the page scrolls top-to-bottom through
 * one project's media, then on to the next.
 */
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
        <ProjectCoverFlow
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
