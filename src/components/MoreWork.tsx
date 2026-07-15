import { getTranslations } from "next-intl/server";
import { getWorkBoardItems, leadWithCaseStudy, type WorkType } from "@/lib/mdx";
import { LinkButton } from "./LinkButton";
import { RevealOnView } from "./Reveal";
import { RevealTile } from "./RevealTile";
import { WorkTile } from "./WorkTile";

// Three tiles: one full-width case study over two half-width play pieces, which
// is exactly one clean row. `leadWithCaseStudy` guarantees index 0 is a project,
// so the row always closes. Going to 4+ re-opens the packing problem below.
const MAX = 3;

/**
 * "More work" — the board grid, minus the piece being read, at the bottom of a
 * case-study / play detail page.
 *
 * WHERE IT LIVES: inside `.content-column-narrow`, as a SIBLING of `<article>`.
 * That placement does three jobs at once:
 *   1. it inherits the article's left edge, so no spacer/offset math is needed
 *      (and the 240px /project axis vs 256px detail axis question never arises);
 *   2. it inherits the 768px cap, so the grid can never bleed past the column;
 *   3. it stays OUTSIDE `<article>`, which is load-bearing: SideDocumentTab
 *      scroll-spies `article :is(h1, h2, h3)` with an id, so a heading with an id
 *      inside `<article>` would leak into the reader's table of contents.
 *      Do not move this into `<article>`.
 *
 * GEOMETRY: 2 columns at the content width, NOT the board's 12. A 12-col grid
 * squeezed into 768px would render ~232px tiles. Here a case study spans both
 * columns and a play piece takes one, so tiles come out slightly LARGER than on
 * /project (368px vs 339px) despite the narrower column.
 */
export async function MoreWork({
  currentType,
  currentSlug,
  locale,
}: {
  /** Content type of the page being read — excluded from the grid. */
  currentType: WorkType;
  /** Slug of the page being read — excluded from the grid. */
  currentSlug: string;
  locale: string;
}) {
  const all = await getWorkBoardItems(locale);
  // Match on type AND slug: the two content trees are separate namespaces, so a
  // slug alone could collide. leadWithCaseStudy is pure — `all` is a cache()d
  // array shared across this request and must not be mutated.
  const rest = leadWithCaseStudy(
    all.filter(
      (it) => !(it.type === currentType && it.slug === currentSlug),
    ),
  );
  const items = rest.slice(0, MAX);
  if (items.length === 0) return null;

  const t = await getTranslations("Nav");
  const labelFor = (type: WorkType) =>
    type === "projects" ? t("caseStudy") : t("play");

  return (
    <>
      {/* The rule that used to lead this component now belongs to Colophon, which
          renders it directly above — it closes the STORY out, so it has to draw
          even when this grid does not. Don't add one back here. */}
      <section aria-labelledby="more-work">
        {/* RevealOnView (scroll-triggered), never Reveal (mount-triggered) — this
            sits at the foot of a long page and would otherwise animate unseen.
            It wraps the heading ONLY: wrapping the grid too would make its
            transform an ancestor of every RevealTile's own transform, doubling
            the motion and skewing the measurement RevealTile uses to drop its
            stagger for below-the-fold tiles. */}
        <RevealOnView>
          {/* items-CENTER, matching the footer's CTA row. `.link-button` is
              itself an inline-flex with `align-items: center` and 4px block
              padding, so baseline-aligning it against the 20px h2 sat it low. */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 id="more-work" className="text-h2 text-fg">
              {t("moreWork")}
            </h2>
            {/* Same control as "Love letter to design": LinkButton and
                LoveLetterButton both render `.link-button .hairline-b`, and both
                use the `right` (in-app forward) arrow here. This is an <a>
                rather than a <button> only because it navigates. */}
            <LinkButton href="/project" arrow="right">
              {t("viewAll")}
            </LinkButton>
          </div>
        </RevealOnView>

        <ul className="grid grid-cols-1 items-start gap-x-8 gap-y-12 sm:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={`${item.type}-${item.slug}`}
              // Keyed on TYPE, not `span`: the board's 3-tier span scale
              // (standard/feature/wide) is 12-column vocabulary and has no clean
              // meaning across 2 columns.
              className={item.type === "projects" ? "sm:col-span-2" : undefined}
            >
              <RevealTile index={i}>
                {/* No `priority`: this is always below the fold, and eager-loading
                    it would compete with the article's own LCP image. */}
                <WorkTile item={item} typeLabel={labelFor(item.type)} />
              </RevealTile>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
