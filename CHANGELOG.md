# Changelog

Running log of what's been built and what's next. **If you're an agent picking
up this project, read the _Status_ section first, then skim the log.** Append an
entry whenever you ship a meaningful change.

Reference docs: `portfolio-master-prompt.md` (the phased plan), `portfolio-project-rules.md`
(design system + i18n rules), `docs/STACK-NOTES-2026.md` (verified stack).

---

## Status — as of 2026-06-21

**Stack:** Next.js 16 (App Router, `proxy.ts` middleware), React 19, TypeScript,
Tailwind v4, next-intl v4, framer-motion, next-mdx-remote-client, Firebase
(App Hosting + Firestore), `@google/genai`.

**Deploy model:** `main` = dev branch, `live` = App Hosting deploy branch
(project `daechankimdesign-2026`, region `us-east4`). Releasing = `git push origin main:live`
(auto-rollout, ~1–2 min). **Local prod builds fail** on this machine (8GB RAM /
full disk) — verify via the cloud build, not `next build` locally. Live URL:
https://daechankimdesign-website--daechankimdesign-2026.us-east4.hosted.app

**Phases (per `portfolio-master-prompt.md`):**
- ✅ Phase 0–4 — foundations, design system, i18n routing, MDX pipeline, motion.
- ✅ Home page, shared Footer, placeholder content (2 projects + 5 sandbox stubs).
- ✅ Phase 5 — on-demand runtime translation **code-complete but DORMANT.** The
  translate trigger is disabled until App Check is configured; ko/es pages render
  the English fallback. To make it live, provision GCP (see _Next steps_).
- ⬜ Phase 6 — offline bulk pre-translation script (`scripts/translate-mdx.mjs`).
  Not started; reuses the Phase 5 pipeline.

**Next steps:**
1. **Activate Phase 5 translation** (all GCP/console work — no code needed):
   - Create a Gemini API key (AI Studio) → `firebase apphosting:secrets:set gemini-api-key`; add `GEMINI_API_KEY` to `.env.local` for local testing.
   - Register App Check (reCAPTCHA v3) for the web app → set `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`.
   - Enable the Anonymous Auth provider in Firebase Auth.
   - Create the Firestore `(default)` database (nam5) — **not yet created**.
   - Deploy `firestore:indexes` (provisions the `rateLimits.expiresAt` TTL).
   - Uncomment the two env blocks in `apphosting.yaml`, then release.
2. **Phase 6** — write `scripts/translate-mdx.mjs` (reuse `src/lib/gemini.ts` +
   `src/lib/translations.ts`; skip slugs already `complete` in Firestore; use `sourceHash`).
3. **Polish backlog** (non-blocking):
   - Pre-existing ESLint errors in `src/app/[locale]/styleguide/page.tsx`
     (`no-html-link-for-pages`) and `src/components/SideDocumentTab.tsx`
     (`set-state-in-effect`).
   - Hero copy + rotating phrases are hardcoded English (`TODO(i18n)` in `page.tsx`);
     move to message bundles when finalized.
   - The transparent sticky header overlaps scrolling content; a `backdrop-blur`
     would improve legibility without adding a solid background.

**Naming note:** commit `021988b` is labelled "Phase 5" but is the Home-page
build; roadmap Phase 5 is the runtime translation (`4348eec`).

---

## Log

### 2026-06-20 — UI refinements (nav, hero, sandbox)

- **Sandbox = pinned scroll-jack carousel** (`b55e4e7`). `SandboxCarousel.tsx`
  replaces the sandbox grid: a tall wrapper pins the section (`sticky`) and maps
  vertical scroll **position** 1:1 to the track's horizontal translate, so the
  carousel advances as part of the page scroll, then vertical scrolling resumes.
  Position-driven (not wheel events) → reversing/re-entering mid-way just works.
  Native horizontal-scroll fallback under `prefers-reduced-motion`. The section
  height is `100vh + horizontal-overflow` by design.
- **Sticky top bar + portaled modal** (`2d526b8`). Header is `sticky top-0 z-30`;
  `SettingsModal` now renders via `createPortal` to `document.body` (z-50) so it
  isn't trapped beneath the z-40 nav pill by the header's stacking context.
  Stacking order: content < header(30) < pill(40) < modal(50).
- **Rotating hero + 60vh** (`208188d`). `RotatingText.tsx`: fixed prefix
  ("Daechan Kim, a product designer") + a clause that rotates through 4 variants.
  Grid-stacked so rotation never reflows; slides in from the bottom, out the top;
  reduced-motion aware. Hero `min-height` 72vh → 60vh.
- **Split universal nav** (`56952c0`). Top bar reduced to logo (left) +
  resume/contact/settings (right) — no center nav, no border, transparent. New
  `UniversalNav.tsx`: transparent hairline pill (Home/Projects/Sandbox/Blogs/About)
  that rides at the top in the first fold and docks at the bottom on scroll;
  always bottom on phones (tab-bar).

### 2026-06-20 — Phase 5: on-demand runtime translation (`4348eec`)

- **Seam:** `readSource(type, slug, locale)` in `src/lib/mdx.ts` — `en` reads
  disk; ko/es read the cached Firestore translation when `complete`, else fall
  back to English (never 404). Threaded through `getCompiled`/`getAllFrontmatter`
  and the detail/index/home pages. Detail pages dropped `dynamicParams=false`
  (en-only `generateStaticParams`) so a new locale renders without a redeploy.
- **Server Action** `src/app/actions/translate.ts`: locale/type/slug allowlist →
  App Check verify → cache check → **atomic pending-lock + windowed rate-limit**
  transaction → Gemini (`@google/genai`, `gemini-2.5-flash`) → validate → store
  `complete` → `updateTag`. Ownership-stamped lock with transactional rollback.
- **Validation** reuses the render pipeline (`src/lib/translations.ts`,
  `src/lib/mdx-validate.ts`): frontmatter preservation + **component-tag identity**
  (renamed/undefined components compile but crash at render) + compile check.
- **Firebase** modules under `src/lib/firebase/` (admin ADC, client App Check,
  anonymous auth). Deny-all `firestore.rules` (Admin-SDK only); `rateLimits`
  TTL via `expiresAt` (`firestore.indexes.json`).
- `SettingsModal` dropdown triggers translation for a missing controlled locale;
  detail pages show an "untranslated" affordance; en/ko/es message keys added.
- Also fixed a pre-existing `<figure>`-in-`<p>` hydration error via
  `rehype-unwrap-images` in the `evaluate()` pipeline.
- **Dormant** until GCP provisioning (see _Status → Next steps_).

### 2026-06-20 — Placeholder content (`f4f1a9f`)

- Stub MDX for 2 projects (Oria, Preserving Local History) + 5 sandbox pieces,
  derived from the Obsidian portfolio notes. Bodies to be written later.

### 2026-06-20 — Phases 0–4 + Home (initial build)

- **Home + Footer** (`021988b`): hero, `FeaturedProjects`, sandbox grid, shared Footer.
- **Phase 4 — motion** (`d76e372`): `DisplayHeading`, `PageTransition`, `SideDocumentTab` (scroll-spy).
- **Phase 3 — MDX** (`9b0865a`, fix `5896229`): runtime MDX (`next-mdx-remote-client`),
  `rehype-slug`, `ProgressiveImage`, `VideoPlayer`, `MDXImage`.
- **Phase 2 — i18n** (`d0903cb`): next-intl v4, single `[locale]` tree,
  `localePrefix: as-needed`, `proxy.ts` middleware (Next 16 rename), `GlobalNav`,
  `SettingsModal`, English fallback.
- **Phase 1 — design system** (`d556b46`): Tailwind v4 tokens, Noto fonts, fluid
  integer-px type scale, hairline-border technique, `/styleguide`.
- **Phase 0 — foundations** (`2e9c399`, `fe4d553`): Next.js 16 scaffold, Firebase
  App Hosting backend (main/live branches), Node 22 pinned, stack research.
