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

### 2026-06-21 — Headings Typography Swap

- **Font Family Swapping:** Exchanged the font configurations of the heading utilities in `globals.css`. The `text-h2` class now uses Noto Sans (`var(--font-sans)`), and the `text-h3` class now uses Noto Serif (`var(--font-serif)`).

### 2026-06-21 — Seamless Header Pin Transition

- **Seamless Sticky Header Crossfade:** Refactored the homepage projects section in `page.tsx` and `FeaturedProjects.tsx` to restore the standard 12-column grid layout, resolving absolute positioning sticky bugs in Chrome/Safari, while creating a seamless transition from the top header to the sticky side header.
  - Reverted `page.tsx` back to the standard grid container (section title in Columns 1-3, projects list in Columns 4-12).
  - Configured each project card's grid to be 9 columns (relative to the 9-column parent cell). Header A spans `lg:col-span-9` (covering both the middle and right columns horizontally at the top).
  - Positioned the sticky Header B in Columns 1-3 of the project card (corresponding to Columns 4-6 of the page, side-by-side with the "Projects" heading in Columns 1-3), sticky at `top-24` to align horizontally on the same line.
  - Configured the `IntersectionObserver` with a `rootMargin: "-64px 0px 0px 0px"` (exact bottom of the sticky `GlobalNav`). This ensures Header B only fades in (`opacity-100 translate-y-0`) when Header A has completely scrolled off-screen, preventing duplicate headers and creating a seamless "pinning" visual transition.

### 2026-06-21 — Scroll-Spy Project Header Transition

- **Scroll-Spy Sticky Header Transition:** Refactored `FeaturedProjects.tsx` to handle a dynamic scroll transition for each project header.
  - Rendered the project title/meta header at the top of the project spanning all 12 columns (`lg:col-span-12`), aligning horizontally on top of the images.
  - Implemented an `IntersectionObserver` in `FeaturedProjectCard` that detects when this top header scrolls above the global nav sticky boundary (`rootMargin: "-96px 0px 0px 0px"`).
  - Created a secondary, sticky side header in Column 1-3 (`lg:col-span-3 lg:sticky lg:top-36`) that fades and slides up smoothly (`opacity-100 translate-y-0`) once the top header scrolls off-screen. This side header pins on the left alongside the vertical images stack and scrolls away when the project finishes.

### 2026-06-21 — Sticky Stacked Heading & Project Headers

- **Sticky Stacked Left Column Layout:** Refactored the projects layout to align the global "Projects" section title and each individual project's header vertically on the left side of the screen as sticky components.
  - Placed the "Projects" heading in an absolute-positioned left-hand column container (`lg:inset-y-16 lg:left-0 lg:w-1/4`), sticky at `top-24`.
  - Configured each project's list item (`FeaturedProjects.tsx`) as a full-width 12-column grid. The project metadata (title, tags, Details link) is placed in Column 1-3, sticky at `top-36` (sitting directly below the global "Projects" title), and scrolls away naturally when that project's vertical image stack (in Columns 4-12) finishes scrolling.
  - Wrapped each sticky project header inside a `motion.div` to animate its entrance (`whileInView`) smoothly with a fade-and-slide motion.

### 2026-06-21 — Sticky Layout Interception Fix

- **Resolved Sticky Breakage:** Removed the `overflow-x-hidden` class from the main content wrapper in `layout.tsx` and modified `PageTransition.tsx` to apply `overflow-hidden` dynamically only during active slide transition animations. This ensures that during normal page viewing, the page container remains `overflow-visible`, restoring standard browser viewport scrolling reference and enabling all sticky elements (like the "Projects" heading and the Side Document scroll-spy tab) to function correctly.

### 2026-06-21 — Home Page Split Column & Vertical Stack Revert

- **Revert to Vertical Preview Stack:** Reverted the featured projects preview gallery in `FeaturedProjects.tsx` to a clean vertical stack of full-width images (`flex flex-col gap-6`) for smooth vertical scrolling.
- **Split Side-by-Side Section Title:** Updated the homepage projects section in `page.tsx` to use a responsive grid layout. On desktop (`lg` and above), the section title "Projects" stays sticky on the left column (`lg:col-span-3 sticky top-24`), while the projects list scrolls on the right column (`lg:col-span-9`). On mobile, it falls back to a clean vertical stack.

### 2026-06-21 — Home Page Project Preview Gallery Layout

- **Responsive Grid & Horizontal Scroll:** Restored the homepage project preview gallery to the design spec in `FeaturedProjects.tsx`. Rendered images as a horizontally scrollable flex row with snap-points on mobile/tablet (each card sized to `85vw` or `48vw` respectively) and as a side-by-side CSS grid on desktop (matching the column count to the number of project images).

### 2026-06-21 — Progressive Image Cache Hydration Fix

- **OnLoad Hydration Fallback:** Integrated a `ref` on the full-resolution Next.js `<Image>` component in `ProgressiveImage.tsx` to check if `complete` is true on mount. This ensures images that load extremely fast or are loaded from browser cache prior to React event listener attachment will correctly crossfade from the low-resolution blur placeholder to the full resolution, fixing the `opacity-0` rendering bug.

### 2026-06-21 — Top Nav Blend Mode & Contrast Refinement

- **Blend Mode & Contrast Tuning:** Applied CSS `mix-blend-difference` directly to the `<header>` element rather than the nested `<nav>` in `GlobalNav.tsx`. This avoids CSS blending isolation within the sticky header's stacking context, allowing the text and icons to blend correctly with the page canvas and scrolled contents.
- **Color Mapping for Plain White Canvas:** Selected exact element colors (`#e1e1e1` for primary logo/links and `#8a8a8a` for muted settings icon) so that when blended with the `#ffffff` canvas, they render exactly in the intended palette colors (`#1e1e1e` and `#757575` respectively).

### 2026-06-21 — Home page refinements

- **Category Heading Styles:** Changed the homepage sections ("Projects" and "Sandbox") from `h2` / `text-h2` (20px bold) to `h3` / `text-h3` (16px medium) in `page.tsx` and `SandboxCarousel.tsx` to align with the visual design hierarchy.
- **Project Spacing & Borders:** Set bottom padding to 64px (`pb-16`) and added a bottom hairline border (`hairline-b`) to each project `<article>` on the homepage via `FeaturedProjects.tsx` to define section breaks. Removed the parent wrapper's `gap-20` to coordinate spacing correctly.
- **Heading Typography Update:** Updated the `text-h3` utility in `globals.css` to use Noto Sans (`var(--font-sans)`) instead of Noto Serif.

### 2026-06-21 — Boxed 3D Rotating Text transition

- **Prevent Text Overlapping:** Refactored the `RotatingText.tsx` component to utilize `AnimatePresence` with `mode="wait"`. This enforces a clean timing gap between the exit animation of the outgoing phrase and the entrance animation of the incoming phrase, ensuring they never overlap.
- **Boxed Layout:** Placed the rotating text wrapper inside a relative, boxed inline-grid layout with `overflow-hidden` to prevent the vertical movement from invading the lines above (e.g. "Daechan Kim, a product designer") or other areas.
- **3D Flipping Board Transition:** Replaced the opacity fade with a premium 3D flipping board animation, using vertical translations (`100%` to `-100%`) coupled with 3D rotations on the X-axis (`rotateX: 75` to `rotateX: -75`), configured with a snappy out-expo easing transition. Restored color inheritance to match the main text color.

### 2026-06-21 — Home page project preview gallery

- **Server-Side Project Image Parsing:** Enhanced `src/lib/mdx.ts` to scan MDX files during the server-side data loading phase and extract up to 5 unique images (standard markdown and custom `<MDXImage />` elements) per project. Added fallback placeholder generation for stubs/projects with fewer than 3 images.
- **Vertical Stack Preview Gallery:** Refactored `FeaturedProjects.tsx` to render preview images as a vertical stack of full-width cards (`flex flex-col gap-6`) so that users can scroll through all 3-5 images vertically on the home page. All images are displayed at a consistent `16:9` ratio with scale-on-hover micro-interactions.

### 2026-06-21 — Sticky Side Document Tab outline layout

- **Side-by-side Desktop Layout:** Refactored project detail pages (`/project/[slug]/page.tsx`) and sandbox detail pages (`/sandbox/[slug]/page.tsx`) to layout content in a responsive sidebar structure on desktop (`flex-col lg:flex-row`), adding a `max-w-4xl` (`896px`) constraint to the main content container to prevent text/images from stretching too wide on wide screens.
- **Open Sidebar Navigation:** Restructured `SideDocumentTab.tsx` to render as a fully open, inline-sticky left sidebar with a `← Index` backlink (auto-detecting target route) and scroll-spy headings.
- **Scroll-Spy Indentation & Alignment:** Aligned all H2 level outline items perfectly with the backlink (0px indentation) and indented H3 sub-sections by 16px.
- **Cascading Render Warning Fixed:** Wrapped the scroll-spy heading extraction inside a deferred `requestAnimationFrame` call to resolve the React hook synchronous render warning.
- **i18n Support:** Localized the "← Index" backlink label using Next-Intl keys across English (`Index`), Spanish (`Index`), and Korean (`목록`).

### 2026-06-21 — Fix empty pages under rapid navigation clicks

- **Simplified Transition Architecture (100% Stable):** Removed the complex `AnimatePresence` and `FrozenRouter` context-freezer hacks that kept exiting routes concurrently in the DOM. These duplicated Next.js layout router context trees, causing Next.js App Router to render blank screens or empty components.
- **Entry-Only Slide Transition:** Replaced exit transitions with a robust, direction-aware entry-only slide-in animation over `0.6s`. Because only one route is ever mounted at a time, pages are guaranteed to load and hydrate with native reliability, completely eliminating the empty/blank page bug.
- **Hydration Warning Suppressed:** Added `suppressHydrationWarning` to the `<html>` and `<body>` tags in `layout.tsx` to prevent browser extensions (such as Grammarly) from triggering hydration mismatch errors by injecting attributes.

### 2026-06-21 — Premium page transitions (exit slide-in & cache)

- **Centralized exit transitions:** Moved transitions to `layout.tsx` wrapping `children` and enabled concurrent exit animations via `AnimatePresence mode="popLayout"`.
- **Symmetrical push transitions:**
  - **Forward (Home -> Projects):** Exiting page slides from `0` to `-100%`; entering page slides from `100%` to `0` (side-by-side push, no overlap, no gaps).
  - **Backward (Projects -> Home):** Exiting page slides from `0` to `100%`; entering page slides from `-100%` to `0`.
- **Immediate exit content fade:** Exiting page content fades out in `0.4s` to make the slate plain. Entering page content animates immediately without delay (`0.5s` fade-in during the slide).
- **Flat transition (No shadows):** Removed border shadow styles from the sliding slates for a cleaner flat aesthetic.
- **Resolved loading bug:** Fixed blank/empty page states by implementing `FrozenRouter` which context-freezes the `LayoutRouterContext` during page exit, preventing Next.js router slot collisions.
- **Synchronized 1.2s timings:** Both entering and exiting slides are locked to `1.2s` with identical easing, ensuring they slide next to each other at the same speed.
- **React compilation cache:** Wrapped file reads and MDX evaluations (`readDiskSource`, `readSource`, `getAllFrontmatter`, `getCompiled`) in React's `cache` to avoid duplicate reads during SSR/metadata cycles.

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
