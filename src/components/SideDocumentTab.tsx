"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type Heading = { id: string; text: string; level: number };

/**
 * Open scroll-spy outline sidebar. Tracks the article's h1–h3 (with ids from
 * rehype-slug) via an IntersectionObserver with a centered rootMargin, so the
 * heading nearest the viewport center is "active". Displays a ← Index backlink
 * at the top and lists active sections.
 */
export function SideDocumentTab({ hidden = false }: { hidden?: boolean }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");
  const t = useTranslations("Nav");
  const pathname = usePathname();

  // The "← Index" backlink only belongs on a project/sandbox detail page; on
  // other pages (e.g. About) the tab is a plain scroll-spy outline.
  const isDetail =
    pathname.startsWith("/project/") || pathname.startsWith("/sandbox/");
  const backTo = pathname.startsWith("/sandbox") ? "/sandbox" : "/project";
  const backLabel = t("backToIndex");

  useEffect(() => {
    if (hidden) return;

    let observer: IntersectionObserver | null = null;

    const handleUpdate = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("article :is(h1, h2, h3)"),
      ).filter((el) => el.id);

      setHeadings(
        nodes.map((el) => ({
          id: el.id,
          text: el.textContent ?? "",
          level: Number(el.tagName.charAt(1)),
        })),
      );

      if (nodes.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            );
          if (visible[0]) setActiveId(visible[0].target.id);
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
      );
      nodes.forEach((el) => observer!.observe(el));
    };

    const frameId = requestAnimationFrame(handleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hidden]);

  if (hidden || headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-6">
      {isDetail ? (
        <Link
          href={backTo}
          className="inline-flex items-center gap-1.5 text-body text-fg-muted no-underline transition-colors hover:text-fg"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </Link>
      ) : null}
      <ul className="flex flex-col gap-3">
        {headings.map((h) => {
          const indent = h.level > 2 ? `${(h.level - 2) * 16}px` : "0px";
          return (
            <li key={h.id} style={{ paddingLeft: indent }}>
              <a
                href={`#${h.id}`}
                className={`block text-body no-underline transition-colors ${
                  activeId === h.id
                    ? "font-medium text-fg"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
