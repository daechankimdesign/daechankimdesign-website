"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useMemo } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing, type Locale } from "./routing";
import { usePageFade } from "@/components/PageFade";

// next-intl owns locale-aware URLs; the transition-aware Link / useRouter below
// wrap navigation in the page-fade curtain (src/components/PageFade.tsx).
const intl = createNavigation(routing);
export const usePathname = intl.usePathname;
const IntlLink = intl.Link;
const useIntlRouter = intl.useRouter;

type NavOptions = { locale?: Locale; scroll?: boolean };

// Copied from next/link: let modified / non-primary clicks fall through to the
// browser (open-in-new-tab, middle-click, etc.).
function isModifiedEvent(e: MouseEvent<HTMLAnchorElement>) {
  const target = e.currentTarget.getAttribute("target");
  return (
    (!!target && target !== "_self") ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.button === 1
  );
}

/**
 * Locale-aware Link that runs the page-fade transition on click. It renders the
 * next-intl Link (correct localized href, SSR, no-JS fallback) but hijacks the
 * click to navigate through the curtain-wrapped router. Modified clicks and any
 * handler that calls preventDefault fall through to native behaviour.
 */
export function Link({ onClick, ...props }: ComponentProps<typeof IntlLink>) {
  const router = useRouter();
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || isModifiedEvent(e)) return;
    e.preventDefault();
    router.push(
      props.href as string,
      props.locale ? { locale: props.locale as Locale } : undefined,
    );
  };
  return <IntlLink onClick={handleClick} {...props} />;
}

/**
 * Locale-aware router whose push/replace run through the page-fade curtain.
 * back()/forward()/refresh() pass straight through (browser back/forward keep
 * native scroll restoration and fade in via the page's own reveals).
 */
export function useRouter() {
  const fade = usePageFade();
  const router = useIntlRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, opts?: NavOptions) =>
        fade ? fade.run(() => router.push(href, opts)) : router.push(href, opts),
      replace: (href: string, opts?: NavOptions) =>
        fade
          ? fade.run(() => router.replace(href, opts))
          : router.replace(href, opts),
    }),
    [fade, router],
  );
}
