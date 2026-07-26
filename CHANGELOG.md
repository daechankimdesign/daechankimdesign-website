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

### 2026-07-26: Resume opens in a PDF viewer modal

- **New `src/components/ResumeModal.tsx`** — `ResumeProvider` + `useResume()`,
  mounted in the locale layout inside `LoveLetterProvider`. Same modal grammar as
  the love letter (portal to `<body>` at z-50, canvas panel, Xmark + Escape +
  click-outside, `documentElement` scroll lock because this site scrolls on
  `<html>`), minus the envelope choreography: a document should arrive at full
  size, not peek and grow.
- **It IS the love letter's sheet.** First attempt was a centred floating panel
  and looked wrong: the browser PDF viewer's own toolbar sat on top and the frame
  was far taller than the page, leaving a big dark letterboxed void. Rebuilt as a
  mirror of `LoveLetterModal` — same constants (`PARTIAL_VW` 60 / `MOBILE_VW` 100
  / `PARTIAL_VH` 36 / `GROW_AT_PX` 40 / `CLOSE_AT_PX` 320 / `PEEK_DROP_PX` 44),
  same 3° tilted peek rising from the bottom edge, same click-or-scroll to grow
  full, same wheel/touch gestures and pull-to-close, same sticky Xmark, same
  bottom fade, no dim overlay.
- **The page renders NATIVELY, not in an iframe.** `react-pdf` 10.4.1 (pdf.js
  5.4.296) draws the single US Letter page (verified: `/Count 1`, `MediaBox
  [0 0 612 792]`) into a `<canvas>` in the sheet's own content column, plus a
  TEXT layer and an ANNOTATION layer. That removes the browser PDF viewer's
  toolbar and dark backdrop at the root — the first iframe attempt showed both,
  which is what made it look wrong. Being real DOM, wheel/touch bubble to the
  scroller, so the peek-to-grow gesture works while the text stays selectable and
  the resume's links stay clickable.
  - The wrapper was chosen over raw `pdfjs-dist` for three things this document
    actually needs: RenderTask cancellation (the sheet resizes at the 640px
    breakpoint and StrictMode double-mounts), the text layer, and the annotation
    layer — the resume carries a real DOI link that a bare canvas would render as
    dead pixels, a regression from the iframe. Weight was NOT the reason: the
    wrapper is 309KB over a `pdfjs-dist` install of 35.8MB either way.
  - Loaded via `next/dynamic` + `ssr:false` (`ResumeDocument.tsx`), so pdf.js is
    fetched on FIRST OPEN, never on first paint.
  - `pdf.worker.min.mjs` is referenced as `new URL(..., import.meta.url)`;
    Turbopack emits and resolves it with **no `next.config` entry** and no
    `public/` copy (which App Hosting would not serve anyway).
- **NEW `src/app/api/resume/route.ts` — a same-origin proxy, and it is load-bearing.**
  pdf.js FETCHES the bytes, unlike the iframe which merely navigated a frame, so
  CORS suddenly applied. The Storage endpoint answers the OPTIONS preflight with
  `access-control-allow-origin: *` but sends **no such header on the actual GET**,
  so the browser blocked the read and pdf.js reported
  `UnknownErrorException: Failed to fetch`. Confirmed with
  `curl -sD - -H "Origin: http://localhost:3000" "<RESUME_URL>"`. Fixing it at the
  bucket needs gsutil/gcloud (unavailable — see docs/MEDIA-PIPELINE.md), so the
  route streams the file from our own origin instead. Only the VIEWER uses it;
  the nav/hero anchors and "Open in new tab" still point straight at Storage,
  since plain navigations never needed CORS.
- **Presentation pass:** sheet width 60vw -> **80vw**; the content column is
  UNPADDED so the page runs flush to the sheet's edges (the action row carries its
  own padding instead); the page's drop shadow is gone, since a flush page has no
  edge for a shadow to describe.
- **Dark mode inverts the page** (`dark:[&_canvas]:invert dark:[&_canvas]:hue-rotate-180`),
  so the resume reads light-on-dark with the rest of the site instead of glaring
  white — in the peek AND the full view. `hue-rotate(180)` puts hues back after
  `invert` flips lightness, so it is a dark page with light text rather than a
  colour negative. Scoped to the CANVAS: the text and annotation layers sit above
  it and are transparent, so inverting them would flip the selection highlight for
  nothing. react-pdf writes `background-color: white` INLINE on `.react-pdf__Page`,
  which a class cannot beat, hence `dark:!bg-[#0d1117]`.
- **Download button added**, pointing at `/api/resume?download=1`; the route sets
  `Content-Disposition: attachment` for that param and `inline` otherwise. This is
  the only reliable way to offer a download — the `download` attribute on an `<a>`
  is IGNORED cross-origin, so a link straight to Storage can never force a save.
  (The eslint `no-html-link-for-pages` rule is disabled on that one line with a
  reason: it is a file download from a route handler, not a page navigation.)
- The column width is measured in a **callback ref, not an effect**: ResizeObserver
  delivery is tied to the browser's rendering steps, which a backgrounded tab
  never gets, so waiting on its first callback left the page unrendered until the
  tab was looked at (observed directly). The observer now only handles later
  resizes. Same shape as LoveLetter's `ref={setScrollerEl}`, and lint-clean.
- Verified live: worker `200`, `/api/resume` `200` (63,122 bytes), canvas bitmap
  1280x1656 for a 640px column (2x DPR, crisp on retina), `.react-pdf__Page`
  width 640 = the column exactly, text layer populated with the resume's text,
  annotation layer carrying 1 live link (`https://doi.org/10.5281/zenodo.8292270`),
  no iframe, and no console errors.
- The sheet mechanics are DUPLICATED from `LoveLetterModal`, not shared: the
  letter's sheet is entangled with its highlight-timing contexts
  (`LetterFullContext` / `SettledContext`), so extracting a common `<BottomSheet>`
  is a worthwhile follow-up rather than a change to make without being able to
  watch the letter afterwards. Both files say so; if one changes, change both.
- **Triggers stay real links.** The nav pill and hero CTA remain
  `<a href={RESUME_URL} target="_blank">`; only a plain left-click is intercepted
  (`e.preventDefault()`), and modifier-clicks fall through. So middle-click,
  cmd-click, "copy link address", and a no-JS visit all still reach the file.
  `NavItem.onClick` / `LinkButton.onClick` were widened to receive the event.
- **iOS caveat:** Safari and some in-app webviews refuse to render a PDF inside
  an iframe and leave it blank, so the modal is never the only route to the file
  — an "Open in new tab" link sits under the sheet at all times.
- Analytics: `resume_opened` with a `source` ("nav" / "hero") replaces the old
  `resume_downloaded` / `hero_resume_cta_clicked` click events;
  `resume_downloaded` now fires from the modal's open-in-new-tab link, where it
  is actually accurate.
- Verified live: clicking nav Resume mounts the dialog (navigation cancelled),
  `iframe src` carries `#view=FitH`, `<html>` overflow locks to `hidden` on open
  and releases on Escape. NOT verified: the rendered PDF and its on-screen size —
  the Browser pane reported `document.hidden: true` / viewport 0x0, so `dvh`
  resolves to 0 and the iframe never fetched. Worth an eyeball in a real window.

### 2026-07-24: Light canvas to cool slate #F8FAFC

- **Light `--color-canvas` / `--color-background` `#FFFFFF` -> `#F8FAFC`** in the
  `@theme` block, plus `viewport.themeColor` (light) in the locale layout and the
  styleguide / design-rules swatch captions. Dark mode untouched.
- `src/lib/theme.ts` needed NO edit: `applyResolvedTheme` already reads
  `--color-canvas` back off `<html>`, so the browser-chrome colour followed the
  new value automatically (verified meta `#f8fafc` light / `#161b22` dark).
- Verified live: body `rgb(248, 250, 252)`; ink 15.93:1; the light marker still
  reads 13.78:1 under `#1E1E1E`.
- **Both modes are now COOL** (slate light, GitHub-blue dark), so the neutral
  greys (`surface` `#E3E3E3`, `hairline` `#D9D9D9`, `surface-subtle` `#F5F5F5`)
  sit correctly in light again — the warm/cool mismatch flagged for the earlier
  cream and blush canvases is resolved on the light side. The DARK neutrals are
  still warm greys (see the dark entry below); that one is open.
- **`fg-muted` darkened `#757575` -> `#6F6F6F` to restore AA.** On the lighter
  white canvas `#757575` cleared 4.5:1; on `#F8FAFC` it fell to 4.40:1, under the
  floor for 16px body text, and it carries real copy (secondary text, meta values,
  inactive nav). `#6F6F6F` restores **4.80:1** on the canvas and **4.61:1** on
  `surface-subtle` (the slug notice boxes, SettingsModal hover) — the only two
  light surfaces muted text actually sits on. Dark `fg-muted` (`#A5A29D`) is
  unchanged; the swatch captions were updated.
  - Checked and NOT an issue: muted-on-`surface` (`#E3E3E3`, 3.92:1) and
    muted-on-`hairline-faint` (`#ECECEC`, 4.25:1) fail numerically but are
    unreachable — `bg-surface` in light is only the 8px nav dot (no text) and
    SettingsModal's selected row (which uses `text-fg`), and `hairline-faint` is
    border-only.
  - Verified live after a reload (CSS HMR had served a stale value): all 22
    `text-fg-muted` nodes compute `rgb(111, 111, 111)`.

### 2026-07-24: Dark palette re-based on GitHub-style blues; green marker

Replaces dark mode's warm near-black neutrals with a cool blue-grey set. Light
mode is untouched throughout.

- **Canvas `#1B1A19` -> `#161B22`** and **footer `#1B1A19` -> `#0D1117`**, in the
  `[data-theme="dark"]` block, the no-JS `prefers-color-scheme` fallback, the
  browser-chrome colour (`THEME_META_COLORS` in `src/lib/theme.ts` +
  `viewport.themeColor` in the locale layout), and the styleguide / design-rules
  swatch captions.
- **The footer now RECEDES** (`#0D1117` under the page's `#161B22`) instead of
  matching the page exactly, so the page card reads as the lit surface. The step
  is subtle by design (1.09:1); the `hairline-t` divider still carries the seam.
- **New `--color-surface-sunken` token.** Light `#F5F5F5` (identical to
  surface-subtle, so nothing shifts); dark `#0D1117`. The MDX `ImageFrame`
  default panel switched from `bg-surface-subtle` to `bg-surface-sunken`, and
  `.surface-invert` now derives its dark canvas from the SAME token
  (`--color-canvas: var(--color-surface-sunken)`) — so framed screenshots on
  project slug pages and the footer match by construction, not by two hexes kept
  in sync by hand. `bg-surface-subtle` was deliberately NOT repointed: WorkTile,
  HeroImageStack, SandboxEmbed and the slug notice boxes all share it.
- **Dark `--hl` is now `rgba(74, 222, 128, 0.26)`** (#4ADE80), replacing the gold
  `rgba(228, 179, 76, 0.28)`. rough-notation's 2 overlapping strokes compound to
  ~0.45 effective, keeping the `#e8e6e3` ink at **4.58:1** over the mark (AA needs
  4.5). 0.28 drops to 4.25, so 0.26 is the ceiling. Text on the new canvas:
  fg 13.9:1, fg-muted 6.8:1.
- **Single-sourced the dark palette.** Every dark value is now declared exactly
  once, as a private `--dark-*` custom property on `:root`; the
  `[data-theme="dark"]` block, the no-JS `prefers-color-scheme` mirror, and both
  `.surface-invert` dark scopes only MAP those onto `--color-*` (no literals).
  Changing a dark colour is a one-line edit and the mirror can no longer drift.
  `--dark-*` is private by convention (not in `@theme`, so Tailwind emits no
  utilities for it); anything needing a dark value at runtime reads the resolved
  `--color-*` off `<html>` instead.
- **`THEME_META_COLORS` deleted** (`src/lib/theme.ts`). `applyResolvedTheme` now
  reads `--color-canvas` back off `<html>` AFTER stamping `data-theme`, so the
  browser-chrome colour follows the CSS palette automatically instead of being a
  duplicated hex pair. `getComputedStyle` resolves the `var()` chain to a literal
  (verified: `#161b22` dark / `#fff` light). Guarded: if the value reads empty
  (stylesheet not applied), the SSR-rendered tags are left alone rather than
  blanked. `viewport.themeColor` in the locale layout necessarily stays a literal
  — it is static metadata evaluated at build time.
- `HL_COLOR` (`src/lib/highlight.ts`) is unchanged: it is only the pre-CSS
  fallback and must stay equal to the LIGHT theme's `--hl`.
- Verified live (computed values): body `rgb(22,27,34)`, footer `rgb(13,17,23)`,
  ImageFrame panel `rgb(13,17,23)` — panel and footer compare EQUAL; light panel
  still `rgb(245,245,245)`; `--hl` `#4ade8042` in dark / `#fde7698c` in light with
  all 6 marks plus the hero circle painting `rgba(74,222,128,0.26)`; theme-color
  metas `#161b22`.
- **Open item:** the dark neutrals (fg `#E8E6E3`, hairline `#383633`, surface
  `#2E2C29`) are still the WARM greys from the near-black palette and now sit
  against cool blue-greys. Contrast is fine; the hue mismatch is cosmetic. Slate
  companions (e.g. `#E6EDF3` / `#30363D` / `#21262D`) would complete the re-base.

### 2026-07-24: Replay the page entrance on a theme change; toggle refinements

- **Content re-reveal** (`src/components/ContentReveal.tsx`, wired in
  `PageTransition.tsx`): changing the resolved theme now replays the page's
  on-load entrance (the `Reveal` cascade, the hero card flights, cover-flow, the
  rough-notation highlight) over the newly themed background, the way a reload
  does. Mechanism: a `key` bound to a replay counter wraps the content inside the
  page card; a theme change bumps the counter, remounting the subtree so every
  child's `initial -> animate` runs again. The wrapper is `display: contents`, so
  layout is unchanged and only the card's content (not the card bg / seam /
  shadow) remounts. It fires only on a genuine change, not the post-hydration
  settle (the first effect adopts the theme already stamped on `<html>`), and opts
  out under reduced motion (the theme swaps with no remount). A remount is
  reload-like, so any live embeds / iframes on project pages reload on a theme
  toggle.
- **Toggle now rightmost** (`UniversalNav.tsx`): pill order is
  **Work · About · Resume · [theme]** (moved from leftmost). The collapse
  gap-cancel margin flipped from `marginRight` to `marginLeft`, so Resume sits
  flush to the pill's right edge when the toggle hides.
- **Toggle icon + behavior** (`ThemeToggle.tsx`): the device option uses the iMac
  icon (`AppleImac2021`, was `Computer`); selecting any option now commits AND
  collapses the expanded row; the dark option's hover rotation reversed.
- Verified on the dev server: a `data-theme` flip remounts the content subtree
  (old nodes detached, fresh nodes mounted), dark tokens applied (`bodyBg`
  `#1b1a19`, `fg` `#e8e6e3`), and a light-return frame caught the cascade
  mid-replay (headline in, sub-text and CTAs not yet revealed). tsc + eslint clean.

### 2026-07-24: Move Resume + theme toggle into the UniversalNav pill

- **Pill layout** (`UniversalNav.tsx`) is now **[theme] · Work · About · Resume**.
  `NavItem` gained an `external` variant (renders `<a target="_blank">` + the
  `resume_downloaded` PostHog event) so Resume rides the same collapse/dot,
  hover-slide, and label-measure machinery as the route items — it collapses to
  a dot like About (never "active").
- **Theme toggle moved** from the top bar (`GlobalNav`) into the pill, leftmost.
  It is NOT a `NavItem`, so the pill's scroll-collapse never turns it into a dot;
  instead a `collapsed` prop **hides it entirely** (width 0) in the dots state and
  it returns when the pill expands (hover / top / footer). Colors switched from
  the header's difference-safe grays to pill tokens (`text-fg-muted` → `text-fg`),
  since the pill isn't `mix-blend`.
- **Collapsed icon = resolved theme** (sun/moon), even in device mode — the
  desktop (`Computer`) icon only appears when the toggle hover-expands to its
  three options (Desktop / Light / Dark). Added `useResolvedTheme()`
  (`ThemeProvider.tsx`) — a `useSyncExternalStore` over a `MutationObserver` on
  `<html data-theme>` — so the collapsed icon tracks a device-mode OS flip too.
- **GlobalNav** trimmed to logo + Contact (theme + Resume removed, unused imports
  dropped).
- Verified: pill renders theme(sun) · Work · About · Resume(external), GlobalNav
  right group = Contact only, tsc clean. (The scroll-collapse hide is a boolean
  gate mirroring the proven dot system; the preview pane wouldn't trigger the
  collapse for a live capture.)

### 2026-07-22: Dark mode (device default, three-way toggle, dark marker)

- **Theme engine** (`src/lib/theme.ts`, `src/components/ThemeProvider.tsx`):
  mode is `device | light | dark`; only explicit light/dark persists in
  `localStorage("theme")`, absence means follow the device. A blocking head
  script (Next 16 preventing-flash recipe) stamps `<html data-theme>` plus
  `color-scheme` before first paint. Mode state is a module store consumed via
  `useSyncExternalStore` (navHover pattern), hydration safe with no
  setState-in-effect. Device mode tracks live OS changes.
- **Tokens** (`globals.css`): the `@theme` block stays the light theme; a
  `:root[data-theme="dark"]` block re-scopes every token. Dark canvas is a warm
  near-black `#1b1a19` (deliberately not pure black), ink `#e8e6e3`, plus dark
  values for muted/subtle/hairline/surface and the shadcn bridge pair. A
  `prefers-color-scheme` block covers no-JS. New `--color-hairline-faint`
  token (`#ececec` light / `#2c2a28` dark) replaces the UniversalNav pill's
  hardcoded border hex. `@custom-variant dark` keys `dark:` utilities off the
  attribute. The footer's `.surface-invert` re-scopes in dark to MATCH the
  page canvas exactly (`#1b1a19`); the hairline-t divider carries the
  separation, since a near-but-not-equal dark read as an accident.
- **Marker recolor**: the highlight is now the CSS variable `--hl`
  (translucent yellow in light, quieter gold `rgba(228,179,76,0.28)` in dark;
  0.28 keeps even rough-notation's double-stroke overlaps AA behind body text).
  rough-notation writes stroke as a presentation attribute, so one global CSS
  rule (`svg.rough-annotation path`) recolors every mark live; `.hl-circle`
  reads the same variable. JS `HL_COLOR` remains only as the library fallback.
- **Toggle** (`src/components/ThemeToggle.tsx`, mounted first in GlobalNav's
  right group): collapsed shows the active mode's icon; hover or focus springs
  the row open to all three (Computer / SunLight / HalfMoon, iconoir), each
  icon with its own hover animation (sun rotates, moon tilts, monitor nods).
  Bare icon row in the difference-safe grays because the header is
  mix-blend-difference; placed leftmost so expansion never shifts
  Resume/Contact. Radiogroup semantics, i18n labels (en/ko/es), PostHog
  `theme_changed`.
- **Hardcoded color fixes** for dark: CoverFlow card backing + side veil
  `bg-white` to `bg-canvas`, and its reflection fade used `hsl(var(--background))`,
  a variable that never existed (broken in both themes), now
  `var(--color-canvas)` + `color-mix`. ImageFrame scrim and WorkTile hover veil
  now `color-mix` off tokens. SandboxEmbed bezel pinned `#1e1e1e` (device
  hardware, like MacbookMockUp); in dark it lifts to the surface token with a
  hairline ring so the demo frame stays distinguished from the dark canvas
  (a ring, not a border: the p-3 == BEZEL width math must not change). `body::before` top fade rebuilt from
  `color-mix` canvas stops. `viewport.themeColor` added per scheme.
- Verified on the dev server: token flip, marker recolor, veils, pill,
  footer, toggle state machine (light / dark / device with storage), light
  mode pixel-identical to before.
- **Post-review hardening** (multi-agent adversarial review, 10 confirmed
  findings fixed): cross-tab storage sync (a second tab now follows a toggle
  made elsewhere); toggle hover/focus coordination (a pending hover-collapse
  can no longer hide a keyboard-focused radio, and blur respects a hovering
  pointer); init script splits its storage read so blocked-storage contexts
  still get the data-theme stamp; `applyResolvedTheme` also rewrites the
  `theme-color` metas so mobile browser chrome follows explicit choices, with
  a ThemeProvider mount sync for stored preferences; SettingsModal scrim
  `bg-black/20` (fg-based scrim inverted to a bright wash in dark);
  styleguide and design-rules color tables now caption light and dark hex.

### 2026-07-14: "More work" section on project detail pages

Every case-study / play detail page now ends with a **More work** grid: three
tiles from the board, minus the piece being read, plus a "View all" link back to
`/project`.

**Where it lives, and why it matters.** `<MoreWork>` renders INSIDE
`.content-column-narrow` as a sibling of `<article>`. That one placement earns
three things for free: it inherits the article's left edge (no spacer or offset
math), it inherits the 768px cap (the grid can never bleed past the column), and
it stays outside `<article>` — which is load-bearing, because `SideDocumentTab`
scroll-spies `article :is(h1, h2, h3)` with an id, so a heading with an id inside
`<article>` would leak into the reader's table of contents. Verified at runtime:
the spy selects only the article's own sections.

**Geometry.** 2 columns at the content width, NOT the board's 12 (a 12-col grid
squeezed into 768px renders ~232px tiles). A case study spans both columns
(768px), a play piece takes one (368px) — so tiles are slightly *larger* than on
`/project` (339px) despite the narrower column. Measured live: 768 / 368 / 368,
left-aligned with the article, zero overflow.

**Why exactly 3.** A case study needs both columns, so a run of plays between two
case studies must be even or CSS leaves a half-column hole. `leadWithCaseStudy`
guarantees index 0 is a project, so 3 always renders as one clean
`[case study] / [play, play]` row. 4 works only by luck of the current mix; all 5
holes on a play page.

**`leadWithCaseStudy` is now exported and PURE** (`src/lib/mdx.ts`). It used to
hoist in place inside `getWorkBoardItems`, which is `cache()`d — `MoreWork`
filters that shared per-request array and re-leads the copy, so mutating it would
have reordered the board for every other consumer on the page. `/project`'s order
is unchanged (verified).

Motion: `RevealOnView` wraps the heading only (wrapping the grid would nest its
transform above each `RevealTile`'s, doubling the motion and skewing the
measurement that drops the stagger for below-fold tiles). No `priority` on tiles —
they lazy-load, confirmed, so they never compete with the article's LCP.

i18n: added `Nav.moreWork` + `Nav.viewAll` to en/ko/es (next-intl throws on a
missing key, so all three are mandatory). `WorkBoardClient` was deliberately NOT
refactored — the two grids have different geometry, so there was nothing to share
beyond `WorkTile`/`RevealTile`, and leaving it alone keeps `/project` at zero
regression risk.

### 2026-07-13: Custom domain live + PostHog analytics shipped to production

**Domain.** Connected `daechan.kim` (registered at Squarespace) to App Hosting.
Removed the Squarespace default A/CNAME/HTTPS records; added the App Hosting apex
A record (`35.219.200.201`), the `fah-claim` TXT, and the `_acme-challenge` CNAME
for cert issuance. Apex verified and serving over HTTPS with a valid cert. The
`www` redirect is not set up yet.

**PostHog.** The automated installer (PR #19) merged analytics into `main` only,
so it never deployed (`live` was 7 commits behind). Merged it into `live` and
released. Integration: `posthog-js`, `instrumentation-client.ts`, `/ingest`
reverse-proxy rewrites in `next.config.ts`, project token in `apphosting.yaml`
(public), and `capture()` calls in GlobalNav/LoveLetter/WorkTile/etc.

**Critical fix.** next-intl's `proxy.ts` matcher did not exclude `ingest`, so it
rewrote `/ingest/*` to `/en/ingest/*` and 404'd every analytics request (silent
zero-capture). Added `ingest` to the matcher negative-lookahead. Verified on live:
`/ingest/static/array.js` returns 200, `/ingest/flags` returns real PostHog JSON,
config.js loads with the token on every page, no console errors.

**Also shipped** (pending local work committed in the same release): résumé link
now points to the Firebase Storage PDF, nav "Contact" is an internal
`/about#contact` link, about-page gallery uses the `render/` stack variants,
`upload-media.mjs` handles PDFs.

Cleanup deferred: the installer committed ~1,600 lines of its own wizard docs
under `.claude/skills/integration-nextjs-app-router/`.

### 2026-07-08 — Reveal footer: switch to fixed, add hysteresis

Two fixes to the reveal footer:

1. **It wasn't actually revealing** — it behaved like a normal footer scrolling up
   with the page. **Root cause (a CSS cascade-layers trap):** the footer carries
   `.hairline-t`, which is defined **unlayered** as `position: relative`. Tailwind's
   `sticky`/`fixed` utilities live in `@layer utilities`, and unlayered rules beat
   layered ones — so `.hairline-t` silently forced `position: relative`, defeating
   BOTH the earlier `sticky` and the `fixed` attempt (the footer stayed in flow and
   scrolled; the `margin-bottom` just opened a white gap above it). Fix: an
   **unlayered, higher-specificity** rule `footer.reveal-footer { position: fixed;
   inset-inline: 0; bottom: 0; z-index: 0 }` that wins over `.hairline-t`. The
   `<footer>` is now truly **fixed at the viewport bottom** (`z-0`, behind the
   `z-10` page card), and the page card's `margin-bottom` (the footer's height) lets
   it lift to uncover the stationary footer. Footer height is measured by a new
   **`FooterReveal`** client component (`ResizeObserver` → `--footer-reveal-h`,
   consumed by `.reveal-content`); fallback `70vh` keeps it reachable pre-JS.
2. **The word reveal reset too soon on scroll-back.** Replaced the near-absolute-
   bottom trigger with **hysteresis keyed to the footer's own height** (responsive):
   play when the footer is ~90% uncovered (`distFromBottom ≤ 0.1·footerH`), reset
   only once it's scrolled back to ~15% uncovered (`> 0.85·footerH`) — so a small
   scroll-up no longer kills it.

Files: `Footer.tsx` (fixed), `layout.tsx` (`reveal-content` + `<FooterReveal/>`),
`globals.css` (`.reveal-content` margin), new `FooterReveal.tsx`, `SequenceReveal.tsx`
(hysteresis). `PageTransition` rounded-b + shadow unchanged.

### 2026-07-08 — Reveal-from-underneath footer (all pages)

The universal footer now sits UNDER the page: the opaque page card lifts/slides up
over the final footer-height of scroll to uncover a stationary footer beneath it.

- **Mechanism (pure CSS, self-sizing, no JS measurement):** the `<footer>` becomes
  `sticky bottom-0 z-0` (in flow, natural height, `mt-24` removed). `sticky bottom-0`
  pins it to the viewport-bottom band throughout the scroll (shifted up within its
  containing block), where the content wrapper (now `z-10`) covers it; the card lifts
  off it over the last footer-height of scroll and it un-sticks seamlessly at the end.
  No ResizeObserver, no `--footer-h` var, no first-paint jump; auto-sizes per locale.
- **Rounded lift edge:** `rounded-b-[28px]` + a tight downward `shadow` go on the
  `PageTransition` motion.div — the only element that owns the opaque `bg-canvas`, so
  its clipped bg reveals the footer at the seam. (An outer wrapper's radius wouldn't
  show under the square inner bg.)
- **Word animation retimed:** `SequenceReveal` gained a `trigger="bottom"` mode — a
  rAF-throttled at-bottom detector that plays the headline+lede reveal ONLY once the
  footer is fully uncovered, and replays each time you return to the bottom. The
  **Contact / Resume / © line is now static** (plain elements outside the sequence),
  visible from first paint. `total` 7 → 5.
- **Removed the bottom edge-fade** (`body::after`): the viewport bottom is now always
  the dark footer, which a white dissolve would haze. Top nav fade (`body::before`)
  unchanged.
- **Sticky-safety:** every added style (`z-index`, `relative`, `border-radius`,
  `box-shadow`, `margin`) is sticky-inert — none create an overflow-clip or transform
  containing block — so the home ProjectCoverFlow pinned decks, the sticky "Projects"
  h3, and the About rails keep pinning, and `useScroll` progress is unchanged.
- Files: `layout.tsx`, `PageTransition.tsx`, `Footer.tsx`, `SequenceReveal.tsx`,
  `globals.css`. `tsc`-shaped changes are lint-clean.

### 2026-07-08 — Home: free the footer (stop snapping the sandbox)

The footer was getting stranded — scrolling to the bottom sprang back up to the
section above. **Cause:** with `scroll-snap-type: y proximity`, the last snap
target was the **sandbox** `.snap-section`, which sits only ~0.5 viewport above
the page bottom (`sandbox + footer − viewport ≈ 420px`). That whole tail is
inside Chrome's proximity snap zone, so releasing near the footer snapped back to
the sandbox. Removing the footer's own `align: end` (per an earlier request) left
it with no competing rest point, so it stranded every time.

**Fix:** dropped `snap-section` from the Sandbox `<section>` (`SandboxCarousel.tsx`),
so the sandbox + footer are now a free-scrolling tail. Snapping remains on the
hero, project 01, and project 02. No footer snap is reintroduced. (Trade-off: the
sandbox no longer snaps into place vertically — it's a horizontal strip, so that
was never essential; the alternative — keeping the sandbox snap — would require
giving the footer its own snap rest, which we don't want.)

### 2026-07-08 — Selected Work: cover-flow visual refinements

- **Project meta to the top-left.** The pinned project title/tags/Details no
  longer vertically centres — it now sits at the top of the left column (`pt-32`,
  just below the sticky "Projects" heading at `top-24`); the deck stays centred.
  (`ProjectCoverFlow.tsx`: the sticky block dropped `flex items-center`; the deck
  column is now its own `flex h-full items-center`.)
- **Taller, viewport-responsive images.** Card height is now **viewport-height
  based**, not a fixed px: `CoverFlow` needs a numeric px `itemHeight`, so
  `PinnedProjectDeck` measures `innerHeight` (desktop-only path → stable) and
  passes `itemHeight = round(innerHeight * 0.7)`, recomputed on resize; the deck
  box is `h-[80svh]`. `itemWidth` stays fixed (760) so height tracks the viewport
  while width still responds to the column via CoverFlow's own width-scaling
  (deriving both from vh at a fixed aspect would let width-scaling cap the height
  and defeat the vh response; the trade-off is the 16:9 image crops a bit more
  horizontally as the card gets taller). The pin/snap math is unaffected (it keys
  off `pinRef` height, not the deck box).
- **#ffffff overlays, not black** (`CoverFlow.tsx`, affects both decks): card
  background `bg-black` → `bg-white`; border `white/10` → `black/10`; and the
  off-centre dim changed from `filter: brightness(0.5)` (darken → black) to a
  white veil (`bg-white` overlay, opacity 0 centred → 0.5 off-centre) so side
  cards fade toward the canvas instead of going dark.

### 2026-07-08 — Selected Work: deck rests on a straight image (per-image snap)

The scroll-linked cover flow was resting at FRACTIONAL positions (a card caught
mid-flip, angled). Now the deck snaps to whole images: at rest exactly one card
faces straight (0° tilt).

- **`ProjectCoverFlow.tsx`** — replaced the continuous
  `pos = useTransform(scrollYProgress, [0,0.9], [0,last])` with a rounded target
  + spring:
  ```
  const target = useTransform(scrollYProgress, (v) =>
    Math.min(Math.max(Math.round(v * last), 0), last));   // integer for ANY scroll
  const pos = useSpring(target, { stiffness: 260, damping: 34, mass: 1, restDelta: 0.001 });
  ```
  `round()` yields an integer at every scroll position, so at rest `pos` settles
  on an exact integer → the centered card's rotation is exactly 0° (proven, and
  browser-independent). During scroll the spring chases each new integer, which
  reads as the deck flipping through images. Damping 34 is just past critical
  (2·√260 ≈ 32.25) so it eases INTO straight with no overshoot/wobble.
- Chose this JS approach over CSS per-image scroll-snap markers: the marker
  approach's straightness depends on the UA proximity threshold (tilt dead-zone
  on stingier engines) and risks mandatory-snap traps (unreachable footer /
  oversized inter-section gaps). JS rounding adds NO page-scroll snap points, so
  those traps are structurally impossible; the section-level proximity snap is
  untouched. (Design chosen via a 3-lens design workflow + math proof.)
- Untouched: CoverFlow.tsx, the horizontal sandbox deck, and the mobile /
  reduced-motion FallbackStack (flat images, no pos pipeline).
- ⚠️ **Runtime verification pending.** Types/lint are clean and the design is
  math-proven, but this session's dev environment degraded (RAM/disk limits —
  repeated dev-server OOM/deaths) and a competing dev-server lock blocked live
  in-browser testing. During debugging the pinned deck appeared frozen on image
  0 on a throwaway server; that server had a partially-deleted Turbopack chunk
  cache, and a clean build serves HTTP 200 with the correct markup — so the
  freeze is believed environmental, not a code defect. Confirm in a healthy dev
  server: scroll through a project and check the image always rests straight and
  the deck still advances image→image with scroll.

### 2026-07-08 — Home: per-section scroll snapping

The index page now **snaps to each section** — hero, project 01, project 02,
sandbox — as you scroll (desktop, fine pointer).

- **`globals.css`** — `scroll-snap-type: y proximity` on the scroll container
  (set on both `html` and `body` to cover either resolving as the scroller),
  gated to `(min-width: 1024px) and (pointer: fine)`. A `.snap-section` utility
  sets `scroll-snap-align: start` + `scroll-margin-top` (clears the fixed bar).
- **`.snap-section`** applied to the hero (`page.tsx`), each project article
  (`ProjectCoverFlow` — both the pinned and fallback variants), and the sandbox
  section (`SandboxCarousel`).
- **Why proximity, not mandatory:** projects 01/02 are multi-viewport *pinned*
  cover-flow regions. `mandatory` would make everything between two section
  snap points unreachable — you could not stop on images 1..n; the scroll would
  jump straight to the next project. `proximity` snaps firmly at the section
  boundaries while leaving the in-project image scroll (and the footer) freely
  reachable. Verified: a mid-pin scroll rests freely (not yanked to the next
  section), confirming the pinned decks are not trapped.
- Scoped safely: only `.snap-section` elements are snap targets, so other routes
  (project detail, about, …) are unaffected even though the type is on `html`.
- Verified: `scroll-snap-type` active at desktop width; 4 snap targets with
  `align: start`; mid-pin scroll stays free; no console errors. (A real
  trackpad/wheel gesture can't be simulated in the headless preview, so the
  final snap *feel* is best confirmed by you in the browser.)

### 2026-07-08 — Selected Work: scroll-linked vertical per-project cover flow

The home "Selected Work" section now shows each project's images as a **vertical
cover flow** (the sandbox's Apple-style 3D deck, re-oriented to the Y axis),
**driven by the page's own scroll** (not a separate, hover-captured wheel).
Each project is **pinned** to the viewport for a tall scroll region; scrolling
advances the deck through that project's images, and when the last image centres
the pin releases and the page flows on to the next project — one continuous
scroll motion ("Model B" — one deck per project). Clicking the centred card
opens the case study (`/project/[slug]`); the meta is pinned in the left column.

- **`CoverFlow.tsx`** — added two props:
  - `orientation` (`horizontal` default | `vertical`): vertical drives cards
    along Y with `rotateX` (sign-flipped). The horizontal sandbox is unchanged.
  - `positionValue?: MotionValue<number>`: an external fractional-position
    driver. When set, the deck is **controlled** by it — its own wheel + drag
    are disabled (`touch-auto`, no capture) so the page scroll drives the cards;
    the centred index is derived by rounding it (`useMotionValueEvent`).
- **`ProjectCoverFlow.tsx`** — per-project wrapper. On capable clients
  (desktop, fine pointer, non-reduced-motion) it renders `PinnedProjectDeck`: a
  tall `pinRef` region + a `sticky top-0 h-svh` inner block; `useScroll` over
  the region maps `scrollYProgress` → `[0, lastImage]` (with a brief hold at the
  end) and feeds it to `CoverFlow` via `positionValue`. Video cards (`.mp4`)
  autoplay muted/looping. Scroll distance per image ≈ `SCROLL_PER_IMAGE` svh
  (tunable). Falls back to a plain vertical image stack on **mobile /
  coarse-pointer** and **reduced-motion** (natural page scroll already reads as
  one continuous motion). SSR renders the fallback; desktop upgrades after mount
  (no hydration mismatch).
- **`FeaturedProjects.tsx`** — now just maps projects → `ProjectCoverFlow`.
- Superseded the earlier same-day hover-captured wheel version (which felt like
  a separate, disjointed scroll). The `vertical` wheel/drag path still exists in
  `CoverFlow` but is bypassed whenever `positionValue` is supplied.
- Verified: `tsc` + `eslint` clean; cold-server load, no console/server errors;
  page-scroll drives the active card `0→last` monotonically per project; project
  1 → project 2 pin hand-off flows; click-through navigates; sandbox horizontal
  deck un-regressed; mobile + reduced-motion fall back to the stack.

### 2026-07-07 — Home entrance: harmonize the hero with the slug-page motion voice

Brought the landing-page entrance into the same motion family as the project
slug page (which uses the shared `src/lib/motion.ts` tokens) — **Option A:
harmonize, don't replace the hero's signature stacking + fly-in sequence.**

- `HeroHeadline.tsx` / `HeroImageStack.tsx`: dropped both local
  `EASE = [0.22,1,0.36,1]` constants and adopted the shared `EASE_OUT =
  [0.16,1,0.3,1]` (easeOutExpo) so every hero beat shares the slug family's
  deceleration. Grew per-element settle durations modestly (subject 0.6→0.9,
  clauses 0.4→0.55, lede/CTA 0.5→0.7, card 0.5→0.6) so the sharper expo tail
  reads as a slow "settle." Kept `STEP`/`LEDE_DELAY` = 600 and the count-driven
  timeline untouched — that chain IS the hero's delay ladder (the analog of
  `DELAY.header → body → sideTab`). No new tokens: the lede/CTA reveals are
  gated by the integer `count`, so `DELAY.home*` tokens would be dead code.
- Hard constraint documented in-code: clause duration (0.55) must stay < `STEP`
  (0.6) or the stacking clauses smear.
- `app/[locale]/page.tsx`: removed the dead `delay={1}` on the Projects
  `RevealOnView`. `#work` sits below the hero's `min-h-[70vh]` section, and
  `RevealOnView` applies `delay` unconditionally on scroll-in — so the prop only
  bought a 1s blank hold before the section faded in. Now reveals promptly.
- Verified: `tsc --noEmit` clean; full home render with no console/server
  errors; reduced-motion paths untouched; adversarial 2-reviewer diff review
  returned no defects.

### 2026-07-05 — Furniture case study: migrate images off Framer CDN → Firebase

- The furniture case study was the only content still hosted on `framerusercontent.com`
  (13 refs). Downloaded all 12 originals to
  `public/projects/translate-furniture-as-a-service-to-tackle-social-phenomenon/`
  (working copies), uploaded to `media/projects/<slug>/` via `scripts/upload-media.mjs`,
  and rewrote every MDX reference (incl. the frontmatter thumbnail) to the canonical
  Firebase `?alt=media` URLs. All 12 verified `200`; page renders with zero Framer refs.
- Removed the now-unused `framerusercontent.com` from `next.config.ts` `remotePatterns`
  (takes effect on next dev restart). The project no longer depends on Framer storage.

### 2026-07-05 — Furniture (ISHO CloudLiving) case study: image alignment

- Same media↔narrative review on `translate-furniture-as-a-service-to-tackle-social-phenomenon.mdx`
  (12 images, all on the Framer CDN — no local/Firebase copies), blind-verified
  with a 12-agent pass.
- **Fixed the one placement mismatch:** the `SmId` image was captioned "Concept 03,
  a convertible bed and dining table" in **Design** but is actually the **"A Day in
  the Life" time-use diagram** — moved to **Research** (beside the Think-Out-Loud
  stimulus) and recaptioned. Design's "three directions" list is now text-only; the
  convertible-bed concept has no asset (gap).
- **Sharpened two over-claiming captions/alts:** the Service hero (`fDyY`) is a
  delivery-tracking + empty→furnished shot, not a generic "final service"; the
  Research stimulus (`cS2R`) alt now names the floor-plan layout tool.
- The other 9 images verified well-placed. Note: `4RBx` (moodboard) also contains a
  journey map that overlaps the standalone blueprint `UFFz` (left as-is).

### 2026-07-05 — Oria case study: media ↔ narrative alignment

- Reviewed every image/video in `accelerating-institutions-to-preserve-the-local-history.mdx`
  against the **actual media** (stills read directly; videos frame-extracted with
  ffmpeg into contact sheets), then blind-verified each caption with a 7-agent pass.
- **Fixed two hard mismatches:** `network.jpg` was captioned "browse public
  campaigns" but shows a neighbor *answering* a prompt (moved to the answering
  beat, recaptioned); `oria-explore.mp4` was captioned "the Oria network / live
  campaigns" but is a *full submission flow* (recaptioned honestly).
- **Broadened / corrected partials:** `oria-admin.mp4` caption now names the whole
  loop it shows; `oria-answer.mp4` recaptioned; `stories.jpg` recaptioned and its
  intrinsic size corrected to 1800×1095.
- **Deduped:** dropped `oria-archive.mp4` from the body (near-identical to
  `stories.jpg`); the file stays in the repo/Storage, just unreferenced.
- **Known gaps (assets to capture):** the "campaign creation / Gemini question
  generation" paragraph and the "ownership + analytics" paragraph have no matching
  screenshot; left text-only pending capture. Domain left as `missionoria.com` per
  owner (screenshots are on `partner.missionoria.com`).

### 2026-07-03 — Sans-only typography (drop Noto Serif)

- **Removed serif entirely.** `text-h3` (the last serif consumer — homepage
  "Projects"/"Sandbox" headings, detail-page sub-headings) now uses
  `var(--font-sans)`. `text-h2`/`text-sub-display` were already sans.
- Stopped loading **Noto Serif**: dropped the `Noto_Serif` import/export from
  `fonts.ts`, the `--font-noto-serif` variable from `layout.tsx`, and the
  `--font-serif` token from the `@theme inline` block in `globals.css`.
- Neutralized Tailwind v4's built-in `--font-serif` default via
  `@theme { --font-serif: initial; }`, so the `font-serif` utility no longer
  exists and no serif family (Georgia/Times) can be applied anywhere.
- Updated the local `/design-rules` reference labels to say Noto Sans.
- Verified against the running dev server: served CSS has 0 `Georgia`/serif
  family references; `text-h3` resolves to Noto Sans.

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
