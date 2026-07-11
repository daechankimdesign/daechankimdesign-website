import { setRequestLocale } from "next-intl/server";
import { getWorkBoardItems } from "@/lib/mdx";
import { WorkBoard } from "@/components/WorkBoard";

// Unified Work board. Case Study (`projects`) and Play (`sandbox`) merge into one
// editorial grid — reverse-chronological, hand-curated tile sizes, with a
// category-filter side tab. The merge is presentation-only: each item keeps its
// on-disk type and routes to its own detail sub-tree. Layout + intro animation
// mirror the About page (side tab + main content column, heading placement).
export default async function WorkIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getWorkBoardItems(locale);

  return (
    <main className="container-page pt-40 pb-24">
      <WorkBoard items={items} />
    </main>
  );
}
