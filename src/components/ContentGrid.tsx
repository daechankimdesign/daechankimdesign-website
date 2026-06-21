import { Link } from "@/i18n/navigation";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ContentItem } from "@/lib/mdx";

export function ContentGrid({
  basePath,
  items,
}: {
  basePath: string;
  items: ContentItem[];
}) {
  if (items.length === 0) {
    return <p className="text-body text-fg-muted">Nothing here yet.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ slug, frontmatter }) => (
        <li key={slug}>
          <Link
            href={`${basePath}/${slug}`}
            className="group block no-underline"
          >
            {frontmatter.thumbnail ? (
              <ProgressiveImage
                src={frontmatter.thumbnail}
                alt={frontmatter.title}
                width={1600}
                height={900}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="mb-4 rounded-md"
              />
            ) : null}
            <h2 className="text-h3 text-fg transition-opacity group-hover:opacity-60">
              {frontmatter.title}
            </h2>
            {frontmatter.tags && frontmatter.tags.length > 0 ? (
              <p className="text-caption mt-1 text-fg-muted">
                {frontmatter.tags.join("  ·  ")}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
