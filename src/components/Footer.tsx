import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const NAV = [
  { href: "/", key: "home" },
  { href: "/project", key: "projects" },
  { href: "/sandbox", key: "sandbox" },
  { href: "/blog", key: "blogs" },
  { href: "/about", key: "about" },
] as const;

export async function Footer() {
  const t = await getTranslations("Nav");

  return (
    <footer className="hairline-t mt-24">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
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

        {/* Nav */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-body text-fg-muted no-underline transition-colors hover:text-fg"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
