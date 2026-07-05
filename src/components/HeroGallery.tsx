"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { NavArrowLeft, NavArrowRight, Xmark } from "iconoir-react";
import type { HeroStackItem } from "./HeroImageStack";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Lightbox gallery for the hero image stack. Portals to <body> at z-[60] (above
 * the settings modal z-50 and both navs), over a frosted white backdrop. On open
 * it plays a staged entrance — backdrop first, then the full-res image, then the
 * caption — and pages across all items (prev/next, arrow keys). Escape + backdrop
 * close, body scroll-lock, and focus is moved into the dialog (with a Tab trap)
 * and restored to the trigger on close.
 */
export function HeroGallery({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: HeroStackItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const open = index !== null;
  const dialogRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (dir: number) => {
      if (index === null) return;
      onIndexChange((index + dir + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    // Move focus into the dialog; restore it to the trigger on close.
    const prevFocus = document.activeElement as HTMLElement | null;
    dialog?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        go(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        go(-1);
        return;
      }
      // Trap Tab within the dialog's focusable controls.
      if (e.key === "Tab" && dialog) {
        const f = dialog.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, go, onClose]);

  if (!open || typeof document === "undefined") return null;
  const item = items[index];

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex items-center justify-center outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
    >
      {/* Backdrop — frosted white, introduced first. */}
      <motion.button
        type="button"
        aria-label="Close gallery"
        className="absolute inset-0 bg-canvas/75 backdrop-blur-xl"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      />

      {/* Controls */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-10 text-fg-muted transition-colors hover:text-fg"
      >
        <Xmark width={28} height={28} />
      </button>
      {items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-fg-muted transition-colors hover:text-fg"
          >
            <NavArrowLeft width={40} height={40} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-fg-muted transition-colors hover:text-fg"
          >
            <NavArrowRight width={40} height={40} />
          </button>
        </>
      ) : null}

      <figure className="relative mx-14 flex w-full max-w-3xl flex-col items-center gap-5">
        {/* Image — enters after the backdrop. */}
        <motion.div
          className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-md"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.28 }}
        >
          {item.full ? (
            // Plain <img>: full-res, natural aspect, no optimizer dependency.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.full}
              alt={item.caption}
              className="block max-h-[78vh] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex aspect-[4/3] w-[min(90vw,768px)] items-center justify-center bg-surface-subtle text-fg-subtle">
              Image {index + 1} — placeholder
            </div>
          )}
        </motion.div>

        {/* Caption — enters last. */}
        <motion.figcaption
          className="max-w-[60ch] text-center text-body text-fg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.5 }}
        >
          {item.caption}
          <span className="mt-2 block text-caption text-fg-muted">
            {index + 1} / {items.length}
          </span>
        </motion.figcaption>
      </figure>
    </div>,
    document.body,
  );
}
