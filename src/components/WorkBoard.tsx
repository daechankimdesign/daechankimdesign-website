import { getTranslations } from "next-intl/server";
import { WorkBoardClient } from "./WorkBoardClient";
import type { BoardItem } from "@/lib/mdx";

/**
 * Server entry for the work board: resolves the localized page heading + type
 * labels, then hands the merged items to the client board, which owns the
 * layout (side tab + main content column), the intro animation, and the
 * category-filter state.
 */
export async function WorkBoard({ items }: { items: BoardItem[] }) {
  const t = await getTranslations("Nav");
  return (
    <WorkBoardClient
      items={items}
      heading={t("work")}
      labels={{ all: t("all"), caseStudy: t("caseStudy"), play: t("play") }}
    />
  );
}
