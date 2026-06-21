import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-display">Daechan Kim</h1>
      <p className="text-body text-fg-muted">
        Product designer — portfolio in progress.
      </p>
      <Link href="/styleguide" className="link text-body mt-2">
        View the design-system styleguide →
      </Link>
    </main>
  );
}
