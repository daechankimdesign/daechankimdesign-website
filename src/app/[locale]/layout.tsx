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
import { PageFadeProvider } from "@/components/PageFade";
import { LoveLetterProvider } from "@/components/LoveLetter";
import { Footer } from "@/components/Footer";
import { FooterReveal } from "@/components/FooterReveal";
import "../globals.css";

const SHARE_TITLE = "Daechan Kim, Product Designer";
const SHARE_DESCRIPTION =
  "Hi, I'm Daechan, an AI-ready designer and builder. I research, design, and ship end-to-end with the latest AI tools.";

export const metadata: Metadata = {
  title: SHARE_TITLE,
  description: SHARE_DESCRIPTION,
  // Social share (OpenGraph) carries the same first-person message, so link
  // previews on Slack / iMessage / X / LinkedIn show it rather than falling back
  // to the bare <title>.
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    type: "website",
  },
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
          {/* PageFadeProvider hosts the transition curtain (z-20) and wraps
              everything that navigates, so the transition-aware Link/useRouter
              can drive the fade-out → navigate → fade-in on every route change. */}
          <PageFadeProvider>
            {/* LoveLetterProvider hosts the letter modal (portal, z-50) and the
                open()/close() bridge for the footer button + envelope. */}
            <LoveLetterProvider>
            <GlobalNav />
            <UniversalNav />
            {/* The opaque page card: z-10 above the fixed reveal footer (z-0), and
                `reveal-content` adds a margin-bottom of the footer's height so the
                card can slide up to uncover the stationary footer at the bottom. */}
            <div className="reveal-content relative z-10 flex flex-1 flex-col">
              <PageTransition>{children}</PageTransition>
            </div>
            <Footer />
            <FooterReveal />
            </LoveLetterProvider>
          </PageFadeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
