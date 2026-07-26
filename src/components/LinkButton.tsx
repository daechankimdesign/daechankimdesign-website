import type { ReactNode } from "react";
import { ArrowUpRight, ArrowRight } from "iconoir-react";
import { Link } from "@/i18n/navigation";

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  /** Render a plain external <a> (opens a new tab) instead of the locale-aware Link. */
  external?: boolean;
  /** Arrow glyph: "up-right" (external/nav feel, default) or "right" (in-app forward). */
  arrow?: "up-right" | "right";
  className?: string;
  // Receives the event so a handler can intercept a plain click (the hero's
  // Resume opens a modal) while leaving modifier / middle clicks to the browser.
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Design-system link button: a text link styled as a control — 8px block
 * padding, an arrow scaled to the text, and a hairline bottom rule.
 * Internal/locale-aware by default; pass `external` for out-of-app links.
 */
export function LinkButton({
  href,
  children,
  external = false,
  arrow = "up-right",
  className = "",
  onClick,
}: LinkButtonProps) {
  const cls = `link-button hairline-b ${className}`.trim();
  const Arrow = arrow === "right" ? ArrowRight : ArrowUpRight;
  const inner = (
    <>
      <span>{children}</span>
      <Arrow aria-hidden />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} onClick={onClick}>
      {inner}
    </Link>
  );
}
