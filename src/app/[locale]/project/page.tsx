import { setRequestLocale } from "next-intl/server";
import { getAllFrontmatter } from "@/lib/mdx";
import { ContentGrid } from "@/components/ContentGrid";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getAllFrontmatter("projects");

  return (
    <main className="container-page py-16">
      <h1 className="text-h1 mb-8">Projects</h1>
      <ContentGrid basePath="/project" items={items} />
    </main>
  );
}
