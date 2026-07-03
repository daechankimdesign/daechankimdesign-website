import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="hairline-t mt-24">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        {/* Brand + contact */}
        <div>
          <p className="text-logo">Daechan Kim</p>
          <div className="mt-2 flex gap-4">
            <a
              href="mailto:daechankim.design@gmail.com"
              className="text-body text-fg-muted no-underline transition-colors hover:text-fg"
            >
              {t("contact")}
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-fg-muted no-underline transition-colors hover:text-fg"
            >
              {t("resume")}
            </a>
          </div>
        </div>

        {/* Copyright — quiet caption; primary nav lives in UniversalNav, so the
            duplicate footer nav is intentionally omitted. */}
        <p className="text-caption text-fg-muted">
          © {year} Daechan Kim. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
