import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notoSans, notoSerif } from "../fonts";
import { routing } from "@/i18n/routing";
import { GlobalNav } from "@/components/GlobalNav";
import { UniversalNav } from "@/components/UniversalNav";
import { Footer } from "@/components/Footer";
import "../globals.css";

export const metadata: Metadata = {
  title: "Daechan Kim — Product Designer",
  description:
    "Portfolio of Daechan Kim, a product designer who plans and conducts qualitative research.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <GlobalNav />
          <UniversalNav />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
