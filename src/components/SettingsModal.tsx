"use client";

import { useLocale, useTranslations } from "next-intl";
import { Xmark } from "iconoir-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, localeNames, type Locale } from "@/i18n/routing";

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

  if (!open) return null;

  // Slugs are never translated, so the locale-stripped pathname is reused
  // verbatim — only the locale prefix changes. Preserves the current page.
  const switchLocale = (next: Locale) => {
    router.replace(pathname, { locale: next });
    onClose();
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
                aria-current={l === locale ? "true" : undefined}
                className={`w-full rounded-md px-3 py-2 text-left text-body transition-colors ${
                  l === locale
                    ? "bg-surface text-fg"
                    : "text-fg-muted hover:bg-surface-subtle hover:text-fg"
                }`}
              >
                {localeNames[l]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
