"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Xmark } from "iconoir-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, localeNames, type Locale } from "@/i18n/routing";
import { translatePage } from "@/app/actions/translate";
import { getAppCheckToken, isTranslationConfigured } from "@/lib/firebase/client";
import { ensureAnonymousIdToken } from "@/lib/firebase/auth";
import type { ContentType } from "@/lib/mdx";

// next-intl's usePathname is locale-stripped, e.g. "/project/oria". Only detail
// pages carry a translatable (type, slug); the URL segment is singular.
const SEGMENT_TO_TYPE: Record<string, ContentType> = {
  project: "projects",
  sandbox: "sandbox",
};

function parseDetail(
  pathname: string,
): { type: ContentType; slug: string } | null {
  const match = pathname.match(/^\/(project|sandbox)\/([^/]+)\/?$/);
  if (!match) return null;
  const type = SEGMENT_TO_TYPE[match[1]];
  return type ? { type, slug: match[2] } : null;
}

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState<Locale | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  // Slugs are never translated, so the locale-stripped pathname is reused
  // verbatim — only the locale prefix changes. Preserves the current page.
  const navigate = (next: Locale) => {
    router.replace(pathname, { locale: next });
    onClose();
  };

  const switchLocale = async (next: Locale) => {
    setNotice(null);
    const detail = parseDetail(pathname);

    // Plain navigation for English, non-detail pages, or when translation isn't
    // configured (no App Check key) — the page falls back to English content.
    if (
      next === routing.defaultLocale ||
      !detail ||
      !isTranslationConfigured()
    ) {
      navigate(next);
      return;
    }

    setBusy(next);
    try {
      const [appCheckToken, idToken] = await Promise.all([
        getAppCheckToken(),
        ensureAnonymousIdToken(),
      ]);
      const result = await translatePage({
        type: detail.type,
        slug: detail.slug,
        locale: next,
        appCheckToken,
        idToken,
      });

      if (result.status === "complete" || result.status === "pending") {
        // Navigate either way: complete shows the translation, pending shows the
        // English fallback + the on-page "translating" affordance.
        router.replace(pathname, { locale: next });
        router.refresh();
        onClose();
      } else if (result.status === "rate_limited") {
        setNotice(t("rateLimited"));
      } else {
        setNotice(t("error"));
      }
    } catch {
      setNotice(t("error"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-fg/20"
        onClick={onClose}
      />
      <div className="relative mx-5 mt-24 w-full max-w-sm rounded-lg border border-hairline bg-canvas p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-h3 font-bold">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-fg-muted transition-colors hover:text-fg"
          >
            <Xmark width={20} height={20} />
          </button>
        </div>

        <p className="text-caption mb-2 text-fg-muted">{t("language")}</p>
        <ul className="flex flex-col gap-1">
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => switchLocale(l)}
                disabled={busy !== null}
                aria-current={l === locale ? "true" : undefined}
                aria-busy={busy === l}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-body transition-colors disabled:opacity-60 ${
                  l === locale
                    ? "bg-surface text-fg"
                    : "text-fg-muted hover:bg-surface-subtle hover:text-fg"
                }`}
              >
                <span>{localeNames[l]}</span>
                {busy === l ? (
                  <span className="text-caption text-fg-muted">
                    {t("translating")}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        {notice ? (
          <p className="text-caption mt-3 text-fg-muted">{notice}</p>
        ) : null}
      </div>
    </div>
  );
}
