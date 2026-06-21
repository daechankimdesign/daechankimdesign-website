"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Settings as SettingsIcon } from "iconoir-react";
import { Link, usePathname } from "@/i18n/navigation";
import { SettingsModal } from "./SettingsModal";

const NAV = [
  { href: "/", key: "home" },
  { href: "/project", key: "projects" },
  { href: "/sandbox", key: "sandbox" },
  { href: "/blog", key: "blogs" },
  { href: "/about", key: "about" },
] as const;

export function GlobalNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // pathname from next-intl is locale-stripped (e.g. "/project/foo").
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="hairline-b">
      <nav className="container-page flex items-center justify-between gap-6 py-4">
        {/* Left — text logo */}
        <Link href="/" className="text-h3 font-bold no-underline shrink-0">
          Daechan Kim
        </Link>

        {/* Center — global nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-body no-underline transition-colors ${
                  isActive(item.href)
                    ? "bg-surface text-fg"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right — resume, contact, settings (separate group) */}
        <div className="flex shrink-0 items-center gap-4">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-body no-underline transition-opacity hover:opacity-60 sm:inline"
          >
            {t("resume")}
          </a>
          <a
            href="mailto:daechankim.design@gmail.com"
            className="hidden text-body no-underline transition-opacity hover:opacity-60 sm:inline"
          >
            {t("contact")}
          </a>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("settings")}
            className="text-fg-muted transition-colors hover:text-fg"
          >
            <SettingsIcon width={20} height={20} />
          </button>
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
