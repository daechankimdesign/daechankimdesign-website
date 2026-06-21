"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { getFrontmatter } from "next-mdx-remote-client/utils";
import { adminDb, adminAuth, adminAppCheck } from "@/lib/firebase/admin";
import {
  readDiskSource,
  getSlugs,
  type ContentType,
  type Frontmatter,
} from "@/lib/mdx";
import { translateMdx } from "@/lib/gemini";
import {
  TRANSLATIONS,
  RATE_LIMITS,
  RATE_LIMIT_TTL_MS,
  translationDocId,
  rateLimitDocId,
  translationTag,
  sourceHash,
  validateTranslatedMdx,
  type TranslationDoc,
  type RateLimitDoc,
} from "@/lib/translations";
import { routing, type Locale } from "@/i18n/routing";

export type TranslateResult =
  | { status: "complete" }
  | { status: "pending" }
  | { status: "rate_limited" }
  | { status: "error"; message: string };

// `blog` is intentionally out of Phase 5 scope (no real on-disk content yet).
const TRANSLATABLE_TYPES: ContentType[] = ["projects", "sandbox"];
// Defense-in-depth: slugs are filesystem/doc-id segments, never free text.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function translatePage(input: {
  type: ContentType;
  slug: string;
  locale: string;
  appCheckToken: string;
  idToken: string;
}): Promise<TranslateResult> {
  const { type, slug, appCheckToken, idToken } = input;
  const locale = input.locale as Locale;

  // 1) Only controlled, non-default, translatable targets, and a real slug that
  //    maps to actual on-disk content (bounds billable Gemini calls to the
  //    finite content × locale set).
  if (!routing.locales.includes(locale) || locale === routing.defaultLocale) {
    return { status: "error", message: "Unsupported locale" };
  }
  if (!TRANSLATABLE_TYPES.includes(type) || !SLUG_RE.test(slug)) {
    return { status: "error", message: "Unsupported content" };
  }
  if (!(await getSlugs(type)).includes(slug)) {
    return { status: "error", message: "Unknown content" };
  }

  // 2) App Check is required even to PROBE the cache (no unauthenticated reads).
  try {
    await adminAppCheck().verifyToken(appCheckToken);
  } catch {
    return { status: "error", message: "Verification failed" };
  }

  const db = adminDb();
  const tRef = db.collection(TRANSLATIONS).doc(translationDocId(slug, locale));

  // 3) Fast path: already complete / in progress — no user identity needed.
  const existing = await tRef.get();
  if (existing.exists) {
    const status = (existing.data() as TranslationDoc).status;
    if (status === "complete") return { status: "complete" };
    if (status === "pending") return { status: "pending" };
  }

  // 4) Creating a NEW translation also requires a verified anonymous identity.
  //    Never trust a client-supplied uid.
  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return { status: "error", message: "Verification failed" };
  }

  // 5) Acquire the pending-lock AND the rate-limit window in ONE atomic
  //    transaction, so concurrent triggers can neither double-spend the Gemini
  //    call nor bypass "one request per user per page per locale".
  const rRef = db.collection(RATE_LIMITS).doc(rateLimitDocId(uid, slug, locale));
  const now = Date.now();
  const lockId = randomUUID();
  let outcome: "acquired" | "complete" | "pending" | "rate_limited";
  try {
    outcome = await db.runTransaction(async (tx) => {
      const tSnap = await tx.get(tRef);
      if (tSnap.exists) {
        return (tSnap.data() as TranslationDoc).status === "complete"
          ? "complete"
          : "pending";
      }
      const rSnap = await tx.get(rRef);
      // A still-valid record blocks; an expired one is treated as absent.
      if (rSnap.exists && (rSnap.data() as RateLimitDoc).expiresAt > now) {
        return "rate_limited";
      }
      tx.set(tRef, {
        slug,
        locale,
        type,
        status: "pending",
        mdx: "",
        frontmatter: {},
        sourceHash: "",
        lockId,
        createdAt: now,
        updatedAt: now,
      });
      tx.set(rRef, {
        uid,
        slug,
        locale,
        status: "pending",
        createdAt: now,
        expiresAt: now + RATE_LIMIT_TTL_MS,
      } satisfies RateLimitDoc);
      return "acquired";
    });
  } catch {
    // Transaction aborted (likely contention). Re-read once: if the winner
    // already created the doc, follow it instead of surfacing a hard error.
    const snap = await tRef.get();
    if (snap.exists) {
      return (snap.data() as TranslationDoc).status === "complete"
        ? { status: "complete" }
        : { status: "pending" };
    }
    return { status: "error", message: "Could not start translation" };
  }

  if (outcome !== "acquired") {
    return outcome === "complete"
      ? { status: "complete" }
      : outcome === "pending"
        ? { status: "pending" }
        : { status: "rate_limited" };
  }

  // 6) Lock held: translate → validate → store `complete` → bust the cache.
  try {
    const source = await readDiskSource(type, slug);
    if (source === null) throw new Error("Source content not found");

    const translated = await translateMdx(source, locale);

    const valid = await validateTranslatedMdx(source, translated);
    if (!valid.ok) throw new Error(valid.reason);

    const { frontmatter } = getFrontmatter<Frontmatter>(translated);
    await tRef.set({
      slug,
      locale,
      type,
      status: "complete",
      mdx: translated,
      frontmatter,
      sourceHash: sourceHash(source),
      createdAt: now,
      updatedAt: Date.now(),
    } satisfies TranslationDoc);

    updateTag(translationTag(slug, locale));
    return { status: "complete" };
  } catch (err) {
    // Release the lock so the page falls back to English and a retry is
    // possible — but only OUR lock (ownership-checked, transactional), and KEEP
    // the rate-limit record (marked failed) so a failed paid attempt still
    // counts against the user's window. The TTL eventually clears it.
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(tRef);
        const data = snap.data() as TranslationDoc | undefined;
        if (snap.exists && data?.status === "pending" && data.lockId === lockId) {
          tx.delete(tRef);
        }
        tx.set(rRef, { status: "failed" }, { merge: true });
      });
    } catch {
      // Best-effort cleanup; the TTL is the backstop.
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Translation failed",
    };
  }
}
