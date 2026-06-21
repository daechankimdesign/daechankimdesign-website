import { setRequestLocale } from "next-intl/server";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container-page py-24">
      <h1 className="text-h1">About</h1>
      <p className="text-body text-fg-muted mt-4">
        Profile content arrives in a later phase.
      </p>
    </main>
  );
}
