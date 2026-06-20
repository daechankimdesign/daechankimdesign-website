# Portfolio Website — Project Rules

**Apply these rules to every screen, component, and revision. Read this file before each UI task — every time, not just once.** This is the canonical source for stack, design tokens, typography, layout, motion, media, and routing/i18n. Project-specific backend/translation architecture and the build plan live in the master prompt.

---

## 1. Tech Stack & Infrastructure
- **Framework:** Next.js (App Router, standard file-based routing).
- **Styling:** Tailwind CSS (configured for the 4px spacing unit and the custom borders below).
- **Animation:** Framer Motion (performance-optimized).
- **Backend & Cloud:** Firebase (Firestore, Auth, Storage) on Google Cloud Platform (GCP); GCP also hosts AI/ML (Gemini).
- **Repository & Deployment:** Source on GitHub. Deployed via **Firebase App Hosting**, auto-building from the GitHub live branch (SSR runs on Cloud Run underneath). Classic Firebase Hosting (static-only) is not used.

## 2. Design Tokens & Core System
- **Color:** strictly the "Figma Simple Design System." Default body text `#1E1E1E`.
- **Spacing:** strict 4px baseline grid (4, 8, 12, 16, 24…) for all margins, padding, and gaps, unless an explicit override is requested.
- **Borders:** hairline `#D9D9D9`. *Do not* use a literal `0.6px` border — sub-pixel borders render inconsistently across pixel densities. Render a 1px-equivalent hairline via a `transform: scale()` technique or a `device-pixel-ratio` media query.
- **Icons:** Iconoir is primary. Lucide or Material Design Icons are secondary fallback libraries only.

## 3. Typography (Noto family — units in px/rem, never pt)
- **Global font:** Noto Sans via `next/font/google` is the default for all UI (robust, future-proof i18n). Use Noto Serif only when explicitly requested.
- **Links:** underline only, inheriting the parent text color; no color change on default or hover.
- **Scale & hierarchy** (values are literal px):
  - **Display:** 40px / Bold — see motion in §5.
  - **H1:** 28px / Bold
  - **H2:** 20px / Bold
  - **H3:** 16px / Medium
  - **Body:** 14px / `#1E1E1E`

## 4. Layout & Responsive Behavior
- **Desktop:** containers fill screen width with `60px` padding on all sides; constrain max width to `1800px`.
- **Mobile (<768px):** reduce container padding to `20px`.
- **Fluid typography (mobile):** size with CSS `clamp()` against viewport width; use CSS `round()` (with a non-rounded `clamp()` fallback for older browsers) so font sizes resolve to whole-integer pixels (no decimals) for crisp rendering. Absolute minimum font size is `11px`.
- **Side Document Tab:** scroll-spy side navigation that tracks the semantic text tags from `h1` through `p` currently centered in the viewport (via IntersectionObserver with a centered `rootMargin`). Collapsible: defaults to a minimalist icon button on desktop and mobile, expanding into the indexed list on click. Expose a Boolean prop to hide it on specific pages (hidden on the `/` index/home page).

## 5. Motion & Performance (Framer Motion)
- **Page transitions (slide, no stacking):** unified, lightweight slide between Next.js routes via `AnimatePresence`; the new page slides into place cleanly as a whole.
- **Entrance behavior:** no delayed or staggered per-element animations; page content slides in together so elements never stack on load.
- **Display heading:** a one-time "slide-in from bottom" entrance (`animate="once"`); default exit is a slide-up. (This is the explicit per-element override to the "no stagger / unified" rule above.)
- **Performance:** snappy durations; animate only `transform` (x, y) and `opacity` to avoid layout thrashing. Motion must feel quick, light, and refined.

## 6. Media & Interactions
- **Image loading:** `next/image` with a progressive pattern — serve a **480px low-resolution placeholder** first, then crossfade to the full-resolution asset via a Framer Motion or CSS transition. Implement as a reusable `ProgressiveImage` wrapper (source the 480px copy via Firebase Storage resizing or a small `next/image` width).
- **Interactive elements:** every button and interactive element has a micro-interaction hover state via Framer Motion `whileHover` or Tailwind `hover:` states.

## 7. Architecture, Routing & i18n
- **Sitemap / structure:**
  - `/` — Index/Home
  - `/about` — Profile/About
  - `/project` — Projects index
  - `/project/[slug]` — individual project (e.g. `/project/projecturl01`)
  - `/sandbox` — Sandbox index
  - `/sandbox/[slug]` — individual sandbox item (e.g. `/sandbox/sandboxurl01`)
- **URL structure & i18n:** localized pathnames via a single `[locale]` route tree (`next-intl`, `localePrefix: 'as-needed'`). **English is the default locale and renders with NO prefix** (`/about`); other locales use an ISO 639-1 prefix — Korean `/ko`, Spanish `/es` (not `/kr`). All routes above live within this structure.
- **Controlled language list:** selectable locales are defined in one config (`i18n/routing.ts`); the language selector is a dropdown bound to that list — users cannot request a locale outside it.
- **Slugs are never translated** — they stay English across all locales.
- **State persistence:** the active locale persists across all routing and interactions. Entering via `/ko` keeps the `/ko` prefix on every nested/dynamic route (`/ko/project/projecturl01`) and on all internal navigation automatically.
- **Missing translation:** render English content while keeping the localized URL intact; never 404. (The on-demand translation flow is defined in the master prompt.)
