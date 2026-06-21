"use client";

import { useEffect, useState } from "react";
import { List, Xmark } from "iconoir-react";

type Heading = { id: string; text: string; level: number };

/**
 * Collapsible scroll-spy (rules §4). Tracks the article's h1–h3 (with ids from
 * rehype-slug) via an IntersectionObserver with a centered rootMargin, so the
 * heading nearest the viewport center is "active". Defaults to a minimalist icon
 * button; expands into the indexed outline on click. `hidden` removes it
 * entirely (the home page passes hidden, and it self-hides without headings).
 */
export function SideDocumentTab({ hidden = false }: { hidden?: boolean }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (hidden) return;

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

    const observer = new IntersectionObserver(
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
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hidden]);

  if (hidden || headings.length === 0) return null;

  return (
    <div className="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
      {expanded ? (
        <nav className="w-56 rounded-lg border border-hairline bg-canvas/95 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-caption uppercase tracking-[0.08em] text-fg-muted">
              Contents
            </span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse contents"
              className="text-fg-muted transition-colors hover:text-fg"
            >
              <Xmark width={16} height={16} />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {headings.map((h) => (
              <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                <a
                  href={`#${h.id}`}
                  onClick={() => setExpanded(false)}
                  className={`block text-body no-underline transition-colors ${
                    activeId === h.id
                      ? "font-medium text-fg"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Open contents"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvas text-fg-muted transition-colors hover:text-fg"
        >
          <List width={20} height={20} />
        </button>
      )}
    </div>
  );
}
