// Cross-component signal: is the top bar (or the risen top pill) hovered?
//
// GlobalNav (top bar) and UniversalNav (pill) are separate `fixed` components
// with no shared parent. This module-level store lets hovering the top bar force
// the pill to its TOP position — it just flips the existing `docked` flag, so the
// pill's existing top/bottom AnimatePresence swap does the movement (no new
// animation). Read it with useSyncExternalStore (the pattern already used here).

let hovered = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function navHoverEnter() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!hovered) {
    hovered = true;
    emit();
  }
}

// Debounced: covers the small gap between the top bar and the risen pill AND
// gives a generous linger after leaving before the pill collapses back down, so
// it doesn't vanish the instant the cursor leaves.
export function navHoverLeave(delay = 1200) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    hovered = false;
    timer = null;
    emit();
  }, delay);
}

export function subscribeNavHover(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNavHovered() {
  return hovered;
}
