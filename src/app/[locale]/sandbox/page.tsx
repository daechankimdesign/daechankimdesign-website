import { setRequestLocale } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { ContentGrid } from "@/components/ContentGrid";

export default async function SandboxIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getAllFrontmatter("sandbox", locale);

  return (
    <main className="container-page py-16">
      <h1 className="text-h1 mb-8">Sandbox</h1>
      <ContentGrid basePath="/sandbox" items={items} />
    </main>
  );
}
