"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AppleImac2021, HalfMoon, SunLight } from "iconoir-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useResolvedTheme, useThemeMode } from "./ThemeProvider";
import { setThemeMode, type ThemeMode } from "@/lib/theme";

// Same debounce pair as UniversalNav's hover-expand, so the two controls share
// one hover temperament.
const HOVER_ENTER_DELAY = 60;
const HOVER_LEAVE_DELAY = 220;

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

// One entry per mode, in fixed display order. `hover` is the icon's own hover
// animation (the "animated icon" part of the control): the sun swings its rays,
// the moon tilts, the iMac gives a small nod. Transform-only.
const OPTIONS: {
  key: ThemeMode;
  labelKey: "themeDevice" | "themeLight" | "themeDark";
  Icon: typeof SunLight;
  hover: { rotate?: number; y?: number };
}[] = [
  { key: "device", labelKey: "themeDevice", Icon: AppleImac2021, hover: { y: -2 } },
  { key: "light", labelKey: "themeLight", Icon: SunLight, hover: { rotate: 90 } },
  { key: "dark", labelKey: "themeDark", Icon: HalfMoon, hover: { rotate: 24 } },
];

/**
 * Theme toggle, living INSIDE the UniversalNav pill (rightmost, after Resume).
 * Collapsed it shows a SINGLE icon of the RESOLVED theme — sun in light, moon
 * in dark — even in device mode (the iMac icon never shows collapsed). Hovering
 * (or keyboard focus) springs the row open to all three options — iMac (device)
 * / Sun (light) / Moon (dark) — where the device option finally shows its iMac
 * icon; click selects AND collapses it straight back to the resolved icon.
 *
 * It is NOT a pill NavItem, so the pill's scroll-collapse (items → dots) never
 * turns it into a dot; instead `collapsed` hides it entirely (width 0) — the
 * compact dots pill shows no toggle, and it reappears when the pill expands (on
 * hover, or at the top / footer). Pill token colors (text-fg-muted → text-fg),
 * since the pill isn't mix-blend.
 *
 * Hydration: useThemeMode / useResolvedTheme report 'device' / 'light' on the
 * server and the hydration render; the real values swap in right after (see
 * ThemeProvider), a pre-hydration cosmetic on the icon only.
 */
export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("Nav");
  const mode = useThemeMode();
  const resolved = useResolvedTheme();
  const [expanded, setExpanded] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hover and keyboard focus BOTH hold the row open, so each collapse path must
  // check the other input before firing.
  const pointerInside = useRef(false);
  const focusInside = useRef(false);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const clearHoverTimer = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  const scheduleExpand = (next: boolean, delay: number) => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => {
      if (!next && (pointerInside.current || focusInside.current)) return;
      setExpanded(next);
    }, delay);
  };

  // Collapsed, the DEVICE option's icon becomes the resolved theme's sun/moon (it
  // is the only option shown when device is active); expanded it shows the iMac.
  const ResolvedIcon = resolved === "dark" ? HalfMoon : SunLight;

  return (
    <motion.div
      role="radiogroup"
      aria-label={t("theme")}
      className="flex items-center"
      // Collapsed the toggle shrinks to width 0 (options below); this -4px margin
      // — animated in step — cancels the pill's gap-1 that would otherwise leave a
      // 4px sliver where the toggle was, so Resume slides flush to the pill edge.
      initial={false}
      animate={{ marginLeft: collapsed ? -4 : 0 }}
      transition={spring}
      onMouseEnter={() => {
        pointerInside.current = true;
        scheduleExpand(true, HOVER_ENTER_DELAY);
      }}
      onMouseLeave={() => {
        pointerInside.current = false;
        scheduleExpand(false, HOVER_LEAVE_DELAY);
      }}
      onFocus={() => {
        focusInside.current = true;
        clearHoverTimer();
        setExpanded(true);
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        focusInside.current = false;
        if (!pointerInside.current) setExpanded(false);
      }}
    >
      {OPTIONS.map(({ key, labelKey, Icon, hover }) => {
        const isActive = mode === key;
        // Pill collapsed → the whole toggle hides (no option shown). Otherwise:
        // only the active option (a single resolved icon), or all three while
        // the toggle is hover-expanded. Width (not scale) animates so the icons
        // never distort — NavItem's pattern.
        const shown = !collapsed && (expanded || isActive);
        const DisplayIcon =
          key === "device" && !expanded ? ResolvedIcon : Icon;
        return (
          <motion.span
            key={key}
            className="flex items-center overflow-hidden"
            initial={false}
            animate={{ width: shown ? "auto" : 0, opacity: shown ? 1 : 0 }}
            transition={spring}
          >
            <motion.button
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={t(labelKey)}
              onClick={() => {
                setThemeMode(key);
                posthog.capture("theme_changed", { mode: key });
                // Selecting COMMITS AND COLLAPSES, even though the pointer/focus is
                // still inside: cancel any pending hover-expand and close. It
                // re-opens only on a fresh hover-in / focus. (The chosen option is
                // now the single visible icon, so focus stays on a shown element.)
                clearHoverTimer();
                setExpanded(false);
              }}
              whileHover={hover}
              transition={spring}
              className={`flex items-center rounded-full px-2 py-1.5 transition-colors ${
                isActive ? "text-fg" : "text-fg-muted hover:text-fg"
              }`}
            >
              <DisplayIcon width={18} height={18} aria-hidden />
            </motion.button>
          </motion.span>
        );
      })}
    </motion.div>
  );
}
