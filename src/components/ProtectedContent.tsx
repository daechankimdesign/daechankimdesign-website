"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "iconoir-react";
import { useTranslations } from "next-intl";
import { EASE_OUT } from "@/lib/motion";

/**
 * Soft password gate for a project's body (see src/lib/protected.ts — deterrent,
 * not real security). It wraps ONLY the article, so the demo frame and the title
 * above it stay open. After the reader dwells DWELL_MS or scrolls — whichever
 * first — the body fades into a PROGRESSIVE blur (sharp where they landed, fading
 * into blur below, via a masked backdrop-filter veil) and a password modal
 * appears. A correct password (checked as a SHA-256 hash) clears the gate and is
 * remembered for the tab session.
 *
 * Deterministic first render: server + first client render are always UNGATED, so
 * there is no hydration mismatch; the trigger arms on mount. If the session
 * already unlocked this slug, it never gates.
 */

const DWELL_MS = 3000; // gate after this long on the page…
const BLUR_PX = 12; // …strength of the gate blur…
const RAMP_PX = 140; // …and the sharp→blur fade distance at the top of the body.
const MODAL_DELAY_MS = 2000; // the prompt trails the blur by this long, then slides up.

const MASK = `linear-gradient(to bottom, transparent 0, #000 ${RAMP_PX}px)`;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ProtectedContent({
  slug,
  hash,
  children,
}: {
  slug: string;
  /** SHA-256 hex of the password for this slug. */
  hash: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const t = useTranslations("Gate");
  const storeKey = `pw-unlocked:${slug}`;

  const [unlocked, setUnlocked] = useState(false);
  const [gated, setGated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump → replays the shake
  const inputRef = useRef<HTMLInputElement>(null);

  // Arm the trigger on mount (never during SSR → no hydration flip). If this slug
  // was already unlocked this session, stay open.
  useEffect(() => {
    if (sessionStorage.getItem(storeKey) === "1") {
      setUnlocked(true);
      return;
    }
    const timer = setTimeout(() => setGated(true), DWELL_MS);
    const onIntent = () => {
      clearTimeout(timer);
      setGated(true);
    };
    const opts = { once: true, passive: true } as const;
    window.addEventListener("scroll", onIntent, opts);
    window.addEventListener("wheel", onIntent, opts);
    window.addEventListener("touchmove", onIntent, opts);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onIntent);
      window.removeEventListener("wheel", onIntent);
      window.removeEventListener("touchmove", onIntent);
    };
  }, [storeKey]);

  // The prompt trails the blur by MODAL_DELAY_MS, then slides up (see below).
  useEffect(() => {
    if (!(gated && !unlocked)) {
      setShowModal(false);
      return;
    }
    const id = setTimeout(() => setShowModal(true), MODAL_DELAY_MS);
    return () => clearTimeout(id);
  }, [gated, unlocked]);

  // Focus the field once the prompt has slid in.
  useEffect(() => {
    if (!showModal) return;
    const id = setTimeout(() => inputRef.current?.focus(), 900);
    return () => clearTimeout(id);
  }, [showModal]);

  const active = gated && !unlocked;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let ok = false;
    try {
      ok = (await sha256Hex(value)) === hash;
    } catch {
      ok = false; // crypto.subtle needs a secure context (https/localhost)
    }
    if (ok) {
      sessionStorage.setItem(storeKey, "1");
      setUnlocked(true);
      setGated(false);
      setShowModal(false);
      setError(false);
    } else {
      setError(true);
      setValue("");
      setAttempt((a) => a + 1);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      {/* The article. Non-interactive + unselectable while gated (a small
          deterrent against clicking links or selecting the blurred text out). */}
      <div className={active ? "pointer-events-none select-none" : undefined}>
        {children}
      </div>

      {/* Progressive frost veil — a masked backdrop-filter (blur) PLUS a
          theme-aware `bg-canvas/70` fill, so the content is genuinely blocked, not
          just blurred (blur alone still reads the text edges through). The mask
          ramps both from transparent at the top (sharp where the reader landed)
          into full frost going down. Scrolls with the content. */}
      {active ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-canvas/70"
          style={{
            backdropFilter: `blur(${BLUR_PX}px)`,
            WebkitBackdropFilter: `blur(${BLUR_PX}px)`,
            maskImage: MASK,
            WebkitMaskImage: MASK,
          }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      ) : null}

      {/* Modal + light scrim. Fixed and centered; the scrim is a faint tint only
          (pointer-events-none) so the sharp header above stays crisp and the page
          still scrolls behind the prompt. */}
      {showModal ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-5">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/10"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          {/* Trails the blur by MODAL_DELAY_MS, then slides up from the bottom +
              fades in. `x` carries the wrong-password shake on its own timing. */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-title"
            className="pointer-events-auto relative w-[min(400px,100%)] border border-hairline bg-canvas p-7 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.35)]"
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, x: attempt ? [0, -6, 6, -5, 5, 0] : 0 }}
            transition={{ duration: 1.0, ease: EASE_OUT, x: { duration: 0.4 } }}
          >
            <h3 id="gate-title" className="text-h3 text-fg">
              {t("title")}
            </h3>
            <p className="text-body mt-1 mb-5 text-fg-muted">{t("subtitle")}</p>

            <form onSubmit={submit} className="flex items-end gap-4">
              <input
                ref={inputRef}
                type="password"
                autoComplete="off"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(false);
                }}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                aria-invalid={error}
                className="text-body min-w-0 flex-1 rounded-none border-b border-hairline bg-transparent px-0 py-2 text-fg outline-none focus:border-fg"
              />
              {/* Same control as the Love letter CTA: a text link with a hairline
                  underline + the in-app forward arrow, not a filled pill. */}
              <button type="submit" className="link-button hairline-b shrink-0">
                <span>{t("unlock")}</span>
                <ArrowRight aria-hidden />
              </button>
            </form>

            <p
              role="alert"
              className="text-note mt-2.5 min-h-[18px]"
              style={{ color: error ? "#c0392b" : "transparent" }}
            >
              {error ? t("error") : ""}
            </p>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
