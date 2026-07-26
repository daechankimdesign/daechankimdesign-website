// Theme system. A MODE is what the user picks ('device' | 'light' | 'dark');
// a RESOLVED theme is what actually renders ('light' | 'dark'). Only an explicit
// light/dark choice is persisted — no stored key means "follow the device", so
// the default stays device-responsive and tracks live OS changes.
//
// The resolved theme is stamped on <html data-theme> (plus color-scheme for
// native scrollbars / form controls); globals.css re-scopes the design tokens
// off that attribute, which restyles every token-driven utility at once.

export type ThemeMode = "device" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Resolve a mode to the theme that should render right now. Client-only. */
export function resolveMode(mode: ThemeMode): ResolvedTheme {
  if (mode === "device") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

/** Stamp the resolved theme on <html>. Client-only. */
export function applyResolvedTheme(theme: ResolvedTheme) {
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.style.colorScheme = theme;
  // Browser-chrome colour is READ BACK from the token we just stamped rather
  // than kept as a duplicate hex here: --color-canvas is already the page
  // background for whichever theme is now active, and getComputedStyle resolves
  // its var() chain (globals.css maps it from the private --dark-* layer). One
  // source of truth; changing the palette in CSS moves the address bar with it.
  const canvas = getComputedStyle(el).getPropertyValue("--color-canvas").trim();
  // Empty only if the stylesheet has not applied yet (this runs post-mount, so
  // in practice never). Leave the SSR-rendered tags alone rather than blanking
  // them — a wrong-but-valid colour beats an empty content attribute.
  if (!canvas) return;
  // The SSR viewport export emits per-scheme <meta name="theme-color"> tags,
  // which can only follow the DEVICE preference. Override BOTH tags' content on
  // every stamp so mobile browser chrome also follows an explicit toggle choice
  // (a light-OS visitor picking Dark otherwise keeps a white address bar over
  // the dark page). Device-mode OS changes re-run this via ThemeProvider.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", canvas));
}

/**
 * Adopt a storage value written by ANOTHER tab (the 'storage' event): refresh
 * the cached mode, restamp <html>, notify subscribers. Without this the module
 * store would go permanently stale in every other open tab — wrong toggle
 * state, and device-mode OS changes overriding the user's stored choice.
 */
export function syncThemeFromStorage(stored: string | null) {
  cachedMode = stored === "light" || stored === "dark" ? stored : "device";
  applyResolvedTheme(resolveMode(cachedMode));
  listeners.forEach((l) => l());
}

// ── Mode store ────────────────────────────────────────────────────────────────
// A module store consumed via useSyncExternalStore (the navHover pattern):
// hydration-safe without any setState-in-effect — the server snapshot is
// 'device', and React swaps in the real stored mode right after hydration.
// The snapshot is cached because React requires getSnapshot to return a stable
// value between store changes.

let cachedMode: ThemeMode | null = null;
const listeners = new Set<() => void>();

export function getThemeModeSnapshot(): ThemeMode {
  if (cachedMode === null) {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      cachedMode = stored === "light" || stored === "dark" ? stored : "device";
    } catch {
      cachedMode = "device"; // storage unavailable → follow the device
    }
  }
  return cachedMode;
}

export function getServerThemeMode(): ThemeMode {
  return "device";
}

export function subscribeThemeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Set the mode: persist (explicit light/dark only), restamp <html>, notify. */
export function setThemeMode(next: ThemeMode) {
  cachedMode = next;
  try {
    // Only explicit light/dark persists; device = absence of a stored key.
    if (next === "device") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage unavailable → the choice still applies for this visit.
  }
  applyResolvedTheme(resolveMode(next));
  listeners.forEach((l) => l());
}

// Blocking init script — inlined into <head> by the locale layout (Next 16's
// preventing-flash-before-hydration recipe) so the resolved theme lands on
// <html> BEFORE first paint: no white flash when arriving in dark. Reads the
// same storage key and mirrors resolveMode/applyResolvedTheme above — keep the
// three in sync. The storage read sits in its OWN try so a blocked-storage
// context (Safari "Block all cookies", partitioned embeds) still gets the
// matchMedia resolution and the data-theme stamp — the dark: variant keys off
// that attribute, so skipping the stamp would drop every dark: utility there.
// The CSS prefers-color-scheme fallback in globals.css covers no-JS entirely.
export const THEME_INIT_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}try{var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.dataset.theme=d?"dark":"light";e.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
