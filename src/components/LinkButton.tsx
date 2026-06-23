import type { ReactNode } from "react";
import { ArrowUpRight } from "iconoir-react";
import { Link } from "@/i18n/navigation";

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  /** Render a plain external <a> (opens a new tab) instead of the locale-aware Link. */
  external?: boolean;
  className?: string;
};

/**
 * Design-system link button: a text link styled as a control — 8px block
 * padding, an up-right arrow scaled to the text, and a hairline bottom rule.
 * Internal/locale-aware by default; pass `external` for out-of-app links.
 */
export function LinkButton({
  href,
  children,
  external = false,
  className = "",
}: LinkButtonProps) {
  const cls = `link-button hairline-b ${className}`.trim();
  const inner = (
    <>
      <span>{children}</span>
      <ArrowUpRight aria-hidden />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
