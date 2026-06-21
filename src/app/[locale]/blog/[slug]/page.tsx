import { setRequestLocale } from "next-intl/server";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <main className="container-page py-24">
      <h1 className="text-h1">Post: {slug}</h1>
      <p className="text-body text-fg-muted mt-4">
        MDX post arrives in a later phase. (locale: {locale})
      </p>
    </main>
  );
}
