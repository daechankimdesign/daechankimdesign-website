import { setRequestLocale } from "next-intl/server";

export default async function SandboxIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container-page py-24">
      <h1 className="text-h1">Sandbox</h1>
      <p className="text-body text-fg-muted mt-4">
        Frontmatter grid arrives in Phase 3.
      </p>
    </main>
  );
}
