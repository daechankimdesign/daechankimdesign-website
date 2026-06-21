import { setRequestLocale } from "next-intl/server";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <main className="container-page py-24">
      <h1 className="text-h1">Project: {slug}</h1>
      <p className="text-body text-fg-muted mt-4">
        MDX case study arrives in Phase 3. (locale: {locale})
      </p>
    </main>
  );
}
