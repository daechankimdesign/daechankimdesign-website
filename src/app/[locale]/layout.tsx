import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notoSans } from "../fonts";
import { routing } from "@/i18n/routing";
import { GlobalNav } from "@/components/GlobalNav";
import { UniversalNav } from "@/components/UniversalNav";
import { PageTransition } from "@/components/PageTransition";
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
      className={`${notoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <NextIntlClientProvider>
          <GlobalNav />
          <UniversalNav />
          {/* z-10 lifts the opaque page card above the sticky reveal footer (z-0)
              so it covers the footer and slides up to uncover it at the bottom. */}
          <div className="relative z-10 flex flex-1 flex-col">
            <PageTransition>{children}</PageTransition>
          </div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
