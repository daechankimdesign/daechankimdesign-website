"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Settings as SettingsIcon } from "iconoir-react";
import { Link } from "@/i18n/navigation";
import { SettingsModal } from "./SettingsModal";

export function GlobalNav() {
  const t = useTranslations("Nav");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 mix-blend-difference">
      <nav className="container-page flex items-center justify-between gap-6 py-4">
        {/* Left — text logo */}
        <Link href="/" className="text-logo no-underline shrink-0 text-[#e1e1e1]">
          Daechan Kim
        </Link>

        {/* Right — resume, contact, settings. Primary nav lives in UniversalNav. */}
        <div className="flex shrink-0 items-center gap-4">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-body no-underline transition-opacity hover:opacity-60 sm:inline text-[#e1e1e1]"
          >
            {t("resume")}
          </a>
          <a
            href="mailto:daechankim.design@gmail.com"
            className="hidden text-body no-underline transition-opacity hover:opacity-60 sm:inline text-[#e1e1e1]"
          >
            {t("contact")}
          </a>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("settings")}
            className="text-[#8a8a8a] transition-colors hover:text-[#e1e1e1]"
          >
            <SettingsIcon width={20} height={20} />
          </button>
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
