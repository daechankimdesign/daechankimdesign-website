import { setRequestLocale } from "next-intl/server";

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container-page py-24">
      <h1 className="text-h1">Blog</h1>
      <p className="text-body text-fg-muted mt-4">
        Posts arrive in a later phase.
      </p>
    </main>
  );
}
