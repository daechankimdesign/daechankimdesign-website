import { ProjectCoverFlow } from "./ProjectCoverFlow";
import type { ContentItem } from "@/lib/mdx";

// Max preview images shown per case study in the home list (keeps each project's
// stack short so the section stays scannable).
const MAX_IMAGES_PER_PROJECT = 3;

/**
 * Featured (Selected Work) list. Each project renders as a plain vertical stack
 * of its images (see ProjectCoverFlow), capped at MAX_IMAGES_PER_PROJECT: the page
 * scrolls top-to-bottom through one project's media, then on to the next.
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
      <p className="text-body text-fg-muted col-span-1 lg:col-span-8 lg:col-start-5">
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
          images={images.slice(0, MAX_IMAGES_PER_PROJECT)}
          detailsLabel={detailsLabel}
        />
      ))}
    </>
  );
}
