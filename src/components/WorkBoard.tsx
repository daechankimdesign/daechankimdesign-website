import { getTranslations } from "next-intl/server";
import { WorkBoardClient, type WorkLabels } from "./WorkBoardClient";
import { DISCIPLINES, disciplineKey } from "@/lib/taxonomy";
import type { BoardItem } from "@/lib/mdx";

/**
 * Server entry for the work board: resolves the localized heading, type labels,
 * status labels, filter UI strings, and the discipline chip labels, then hands
 * the merged items to the client board (which owns layout, intro animation, and
 * the two-axis filter state).
 *
 * Discipline labels are looked up from the `WorkTags` catalog by camelCase key;
 * a locale that hasn't translated a discipline falls back to the (English)
 * canonical name, so a chip never renders blank — the same status quo the raw
 * tag row had before this change.
 */
export async function WorkBoard({
  items,
  showHeading = true,
  syncUrl = false,
}: {
  items: BoardItem[];
  showHeading?: boolean;
  /** Sync filter state to the URL. Only the standalone /project board sets this. */
  syncUrl?: boolean;
}) {
  const nav = await getTranslations("Nav");
  const w = await getTranslations("WorkTags");

  const disciplines: Record<string, string> = {};
  for (const d of DISCIPLINES) {
    const key = disciplineKey(d);
    disciplines[d] = w.has(key) ? w(key) : d;
  }

  const labels: WorkLabels = {
    all: nav("all"),
    caseStudy: nav("caseStudy"),
    play: nav("play"),
    shipped: w("shipped"),
    concept: w("concept"),
    filterBy: w("filterBy"),
    clear: w("clear"),
    empty: w("empty"),
    // Non-ICU %tokens% so it returns literally here and the client fills in the
    // live counts (server can't know client filter state).
    showing: w("showing"),
    disciplines,
  };

  return (
    <WorkBoardClient
      items={items}
      heading={nav("work")}
      labels={labels}
      showHeading={showHeading}
      syncUrl={syncUrl}
    />
  );
}
