import { getTranslations } from "next-intl/server";
import { normalizeDate } from "@/lib/mdx";

/**
 * End-of-story colophon: when the document was last revised and the organization
 * it was made under, sitting quietly over the rule that closes the story out
 * before "More work".
 *
 * WHERE IT LIVES: inside `.content-column-narrow`, as a SIBLING of `<article>`,
 * directly above MoreWork — same reasoning as MoreWork itself (inherits the
 * article's edge and 768px cap, and stays outside `<article>` so it can never
 * leak into SideDocumentTab's `article :is(h1,h2,h3)` scroll-spy).
 *
 * THE RULE IS OURS. It used to be MoreWork's leading `<hr>`. It belongs here
 * instead: it marks the end of the STORY, not the start of the grid — so it must
 * still draw on a page whose MoreWork renders nothing (fewer than two other
 * pieces). That is why this component never returns null: the meta line above it
 * is conditional, the rule is not.
 */
export async function Colophon({
  updated,
  date,
  org,
  locale,
}: {
  /** ISO date the document was last revised. Preferred over `date`. */
  updated?: string;
  /** When the WORK happened — the fallback when no `updated` is set. */
  date?: string;
  /** Organization the work was done under; rendered with an "@" prefix. */
  org?: string;
  locale: string;
}) {
  // YAML hands back a Date for an unquoted `date: 2026-03-01` but a string for a
  // quoted one, so both go through normalizeDate rather than being trusted as
  // the `string` the Frontmatter type claims.
  const iso = normalizeDate(updated) || normalizeDate(date);

  // UTC is load-bearing: `new Date("2026-03-01")` parses as UTC midnight, so
  // formatting it in a timezone behind UTC would render the month before.
  const when = iso
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(iso))
    : null;

  const t = await getTranslations("Content");

  return (
    <div className="mt-12 mb-12">
      {when || org ? (
        <div className="text-note mb-2 flex items-baseline justify-between gap-4 text-fg-subtle">
          <span>{when ? `${t("updated")} ${when}` : ""}</span>
          {org ? <span>@{org}</span> : null}
        </div>
      ) : null}
      <hr className="hairline-b border-0" />
    </div>
  );
}
