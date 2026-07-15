import type { ReactNode } from "react";

/**
 * About-page contact block. `ContactGrid` lays its entries side by side (wrapping
 * on narrow screens); each `ContactItem` keeps the page's title + muted-meta
 * hierarchy — the label reads as the h3-level title and the linked address /
 * handle as the quiet meta line, matching Education / Certification / Awards.
 *
 * Markdown can't group an h3 + its meta into a column, hence the components.
 */
export function ContactGrid({ children }: { children?: ReactNode }) {
  return <div className="mt-8 flex flex-wrap gap-x-16 gap-y-6">{children}</div>;
}

export function ContactItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  // mailto stays in-page; a real URL opens in a new tab.
  const external = !!href && !href.startsWith("mailto:");
  return (
    <div className="min-w-0">
      <h3 className="text-h3 m-0">{label}</h3>
      <span className="text-note mt-2 block text-fg-muted">
        {href ? (
          <a
            href={href}
            className="link"
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {value}
          </a>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
