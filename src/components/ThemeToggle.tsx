"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Computer, HalfMoon, SunLight } from "iconoir-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useThemeMode } from "./ThemeProvider";
import { setThemeMode, type ThemeMode } from "@/lib/theme";

// Same debounce pair as UniversalNav's hover-expand, so the two controls share
// one hover temperament.
const HOVER_ENTER_DELAY = 60;
const HOVER_LEAVE_DELAY = 220;

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

// One entry per mode, in fixed display order. `hover` is the icon's own hover
// animation (the "animated icon" part of the control): the sun swings its rays,
// the moon tilts, the monitor gives a small nod. Transform-only.
const OPTIONS: {
  key: ThemeMode;
  labelKey: "themeDevice" | "themeLight" | "themeDark";
  Icon: typeof Computer;
  hover: { rotate?: number; y?: number };
}[] = [
  { key: "device", labelKey: "themeDevice", Icon: Computer, hover: { y: -2 } },
  { key: "light", labelKey: "themeLight", Icon: SunLight, hover: { rotate: 90 } },
  { key: "dark", labelKey: "themeDark", Icon: HalfMoon, hover: { rotate: -24 } },
];

/**
 * Theme toggle for the top bar. Collapsed it shows only the ACTIVE mode's icon;
 * hovering (or keyboard focus) springs the row open to reveal all three options
 * (device / light / dark) — the same collapsed-to-expanded width animation as
 * the UniversalNav pill — and hovering any icon plays that icon's own
 * animation. Click selects; the row collapses back to the chosen icon on leave.
 *
 * It lives INSIDE GlobalNav's mix-blend-difference header, so it must stay a
 * bare icon row (no solid pill — a filled background would blend into noise)
 * and uses the header's difference-safe gray pair (#8a8a8a resting, #e1e1e1
 * lit), matching the Resume/Contact links beside it.
 *
 * Hydration: useThemeMode reports 'device' on the server and the hydration
 * render; the stored preference swaps in right after (see ThemeProvider).
 */
export function ThemeToggle() {
  const t = useTranslations("Nav");
  const mode = useThemeMode();
  const [expanded, setExpanded] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hover and keyboard focus BOTH hold the row open, so each collapse path must
  // check the other input before firing — otherwise a scheduled hover-collapse
  // hides a still-focused radio (width 0 with keyboard focus trapped on it), and
  // a blur-collapse closes the row under a still-hovering pointer.
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
      // A collapse only lands if neither input holds the row open by then.
      if (!next && (pointerInside.current || focusInside.current)) return;
      setExpanded(next);
    }, delay);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className="flex items-center"
      onMouseEnter={() => {
        pointerInside.current = true;
        scheduleExpand(true, HOVER_ENTER_DELAY);
      }}
      onMouseLeave={() => {
        pointerInside.current = false;
        scheduleExpand(false, HOVER_LEAVE_DELAY);
      }}
      // Keyboard parity with hover: focus anywhere inside expands (and cancels
      // any pending hover-collapse); leaving the group collapses unless the
      // pointer still hovers it. (React onFocus/onBlur are focusin/focusout —
      // they bubble from the option buttons.)
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
        // Collapsed → only the active icon; expanded → all three. Width (not
        // scale) animates so the icons never distort — NavPill's pattern.
        const shown = expanded || isActive;
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
              }}
              whileHover={hover}
              transition={spring}
              className={`flex items-center px-1.5 transition-colors ${
                isActive
                  ? "text-[#e1e1e1]"
                  : "text-[#8a8a8a] hover:text-[#e1e1e1]"
              }`}
            >
              <Icon width={18} height={18} aria-hidden />
            </motion.button>
          </motion.span>
        );
      })}
    </div>
  );
}
