"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getServerThemeMode,
  getThemeModeSnapshot,
  resolveMode,
  subscribeThemeMode,
  syncThemeFromStorage,
} from "@/lib/theme";

/**
 * The current theme MODE ('device' | 'light' | 'dark'), hydration-safe: the
 * server (and the hydration render) sees 'device'; React swaps in the stored
 * preference right after hydration. State lives in a module store
 * (src/lib/theme.ts) consumed via useSyncExternalStore — the same pattern as
 * navHover — so there is no context object and no setState-in-effect.
 */
export function useThemeMode() {
  return useSyncExternalStore(
    subscribeThemeMode,
    getThemeModeSnapshot,
    getServerThemeMode,
  );
}

/**
 * Hosts the theme's global behaviors: a mount sync (theme-color metas for
 * stored choices), live OS-scheme following while in device mode, and
 * cross-tab storage sync. The initial pre-paint stamp is the head script's job
 * (THEME_INIT_SCRIPT); changing the mode is setThemeMode's (both in
 * src/lib/theme.ts). Renders children untouched.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Mount sync: the head script already stamped data-theme, but it cannot
    // touch the theme-color metas (they render after it) — re-applying here
    // brings mobile browser chrome in line with a STORED explicit choice.
    // Idempotent for everyone else.
    applyResolvedTheme(resolveMode(getThemeModeSnapshot()));

    // Device mode follows the OS live.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getThemeModeSnapshot() === "device") {
        applyResolvedTheme(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);

    // Cross-tab sync: another tab's toggle writes storage; without this the
    // module store here would stay stale forever (wrong toggle state, and
    // device-mode OS changes overriding the stored choice).
    const onStorage = (e: StorageEvent) => {
      // key === null is storage.clear(); treat like a removed key (device).
      if (e.key !== null && e.key !== THEME_STORAGE_KEY) return;
      syncThemeFromStorage(e.key === null ? null : e.newValue);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return children;
}
