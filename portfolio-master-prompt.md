# AI Project Initialization Prompt: Portfolio Website

## ⚠ STOP — wait before you begin
This project is governed by a separate rules file, **`portfolio-project-rules.md`**. **Do not scaffold or write any code until I confirm the rules file has been saved into the repository.** Reply that you've read this prompt, then wait for my explicit "rules file saved — proceed" before starting Phase 0.

## Project rules — consult on every screen
`portfolio-project-rules.md` is the canonical source for the tech stack, design tokens, typography, layout/responsive behavior, motion, media handling, and routing/i18n conventions. **Read it and apply it before building or revising ANY screen, component, or layout — every single time, not just at the start.** If something in this prompt appears to conflict with the rules file, the rules file wins for design/stack/i18n conventions; this prompt governs the build plan and the backend/translation architecture below, which the rules file intentionally does not cover.

---

## What this prompt adds beyond the rules file

- **Hosting:** Firebase App Hosting, auto-deploying from the GitHub live branch (Cloud Run underneath). Classic Firebase Hosting (static) is not used.
- **MDX:** compiled at **runtime** via `next-mdx-remote-client` (the maintained successor to the archived `next-mdx-remote`). English originals live as `.mdx` files in the repo; translations are served from Firestore as MDX strings.
- **AI:** Google **Gemini**, called with a **Google Cloud API key** (NOT Claude), via environment variables / Firebase AI Logic — never hard-coded.
- **Database:** Cloud Firestore (translation cache).
- **Next.js version:** pin the latest stable in `package.json` and tell me what it is. If that version uses the `proxy.ts` middleware convention instead of `middleware.ts`, use `proxy.ts` and note it.

---

## Translation System (drives Phases 2, 5, 6)

**Controlled language list.** Selectable target locales live in one config array (`i18n/routing.ts`); the language dropdown is bound to it. Users can never request a locale outside the list. Editing the array is the only way to add/remove a language.

**English fallback.** Visiting a localized route with no translation yet (e.g. `/ko/project/single-mold-stool`) renders the English MDX while keeping the `/ko/` URL intact — never a 404. Show a small "translation pending — translate this page?" affordance.

**On-demand translation (public, one-shot per user, globally cached):**
1. The user picks a language from the controlled dropdown and triggers translation.
2. A Server Action checks Firestore for `{slug}_{locale}`:
   - `complete` → return the stored translation, **no API call**.
   - `pending` → return "in progress" (do not fire a second call).
   - missing → atomically set `pending` (transaction, to avoid races), call Gemini, validate the result still parses as MDX, store the translated frontmatter + body, set `complete`. On failure, clear the lock so it can be retried.
3. **Rate limit:** each user may trigger translation **once per page per locale**. Use Firebase **Anonymous Auth** for a stable uid + Firebase **App Check** to block off-app abuse; record the uid's request and reject a repeat from the same user for the same page+locale.
4. Once `complete`, the translation is served from Firestore to **all** future visitors with no further API calls — the first successful request permanently creates that language version of the page.

**Translate vs preserve (on-demand AND the offline script):**
- Translate: frontmatter `title`, `summary`, and the markdown prose body.
- Preserve verbatim: `slug`, `thumbnail` and all URLs/paths, dates, and all custom JSX/React tags (e.g. `<VideoPlayer />`) including props.
- The Gemini prompt must state this explicitly, and output must be parse-validated as MDX before storing.

**Firestore doc shape (suggested):** `translations/{slug}_{locale}` → `{ status, frontmatter, body, sourceHash, createdAt, updatedAt }`. `sourceHash` lets the offline script detect changed English sources.

---

## Directory structure (target)

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx
│       ├── page.tsx                  # Home
│       ├── about/page.tsx
│       ├── project/
│       │   ├── page.tsx              # Index — frontmatter grid only
│       │   └── [slug]/page.tsx       # Dynamic MDX
│       └── sandbox/
│           ├── page.tsx              # Index — frontmatter grid only
│           └── [slug]/page.tsx       # Dynamic MDX
├── actions/
│   └── translate.ts                  # Server Action: on-demand translation
├── components/
│   ├── GlobalNav.tsx
│   ├── SettingsModal.tsx             # Language dropdown (controlled list)
│   ├── SideDocumentTab.tsx           # Collapsible scroll-spy
│   ├── PageTransition.tsx            # AnimatePresence wrapper
│   ├── DisplayHeading.tsx            # One-time entrance animation
│   ├── ProgressiveImage.tsx          # 480px low-res → full crossfade
│   └── mdx/                          # VideoPlayer, MDXImage, etc.
├── content/
│   └── en/
│       ├── projects/single-mold-stool.mdx
│       └── sandbox/<example>.mdx
├── lib/
│   ├── firebase.ts                   # client + admin init
│   ├── translations.ts               # Firestore get/set + caching
│   ├── gemini.ts                     # translate() via Google Cloud key
│   └── mdx.ts                        # frontmatter parse + runtime compile
├── i18n/
│   ├── routing.ts                    # controlled locale list + routing config
│   └── request.ts
├── scripts/
│   └── translate-mdx.mjs             # Phase 6 offline bulk pre-translation
├── middleware.ts                     # next-intl middleware (or proxy.ts)
└── apphosting.yaml                   # Firebase App Hosting config
```

`<VideoPlayer />` supports three modes via a `type` prop: `gif` (real `.gif`), `video` (CDN-hosted `.mp4`/`.webm` rendered as `<video autoplay loop muted playsInline>` with no controls), and `embed` (YouTube/Vimeo responsive iframe). Do not commit large video files to the repo.

---

# Phased Execution

After each phase: build/run, then **stop and report** what was built and the verification steps below. Wait for my confirmation before starting the next phase. Re-read `portfolio-project-rules.md` whenever you build or touch a screen.

### Phase 0 — Foundations & deployment pipeline
1. Initialize Next.js (App Router) + TypeScript + Tailwind. Install: `next-intl`, `framer-motion`, `next-mdx-remote-client`, `gray-matter`, `firebase`, `firebase-admin`, `iconoir-react`, `lucide-react`, `rehype-slug`.
2. Create the Firebase project; provision Firestore; create an **App Hosting backend** connected to this GitHub repo + live branch so pushes auto-deploy. Add `apphosting.yaml`.
3. Wire environment variables for the Google Cloud / Gemini key (never committed) and Firebase config.
- **Verify:** a blank app deploys to App Hosting on push and the live URL loads.

### Phase 1 — Design system
1. Implement the full design system exactly as specified in `portfolio-project-rules.md` §2–§4: 4px grid, color/border tokens, the hairline-border technique, Noto fonts, the fluid integer-px type utility (`clamp()` + `round()` with fallback and the 11px floor), and the type scale (in px).
2. Build a `/styleguide` page rendering every type level, color, spacing token, and the hairline border.
- **Verify:** open `/styleguide`; all tokens and type levels render correctly; fonts resolve to whole pixels on resize.

### Phase 2 — Routing & i18n skeleton
1. Set up `next-intl` per rules §7: single `[locale]` tree, `localePrefix: 'as-needed'` (English no prefix, others `/ko`, `/es`), the controlled locale list, middleware, `hreflang`/metadata/sitemap, and locale persistence across navigation.
2. Build `GlobalNav` (Home, Projects, Sandbox, About, Settings) and `SettingsModal`'s language **dropdown** (controlled list) that swaps locale while preserving the current slug.
3. Implement the English fallback for missing translations (no 404, URL preserved).
- **Verify:** navigate `/`, `/about`, `/ko/about`; switch language on a deep route and confirm the slug + prefix persist; hit a non-existent localized route and confirm English renders with the URL intact.

### Phase 3 — MDX content pipeline
1. Runtime MDX via `next-mdx-remote-client`; frontmatter-only parsing for index grids; `rehype-slug` for heading IDs.
2. The `ProgressiveImage` wrapper (480px low-res → full crossfade, per rules §6) and the `<VideoPlayer />` component (gif/video/embed).
3. Provide `content/en/projects/single-mold-stool.mdx` and one sandbox example.
- **Verify:** the case-study page renders MDX with working progressive images, video, and heading IDs; project and sandbox index grids populate from frontmatter.

### Phase 4 — Specialized components & motion
1. `SideDocumentTab` per rules §4: collapsible scroll-spy tracking `h1`–`p` centered in the viewport (IntersectionObserver, centered `rootMargin`); minimalist icon button by default, expands on click; Boolean hide prop (hidden on `/`).
2. `PageTransition` per rules §5 (unified slide, no stacking, transform/opacity only) and `DisplayHeading` (one-time `animate="once"` slide-in from bottom, slide-up exit).
- **Verify:** scroll-spy highlights the centered tag and collapses/expands; page transitions slide as a unit with no staggering; the Display entrance plays once and does not conflict with transitions.

### Phase 5 — On-demand runtime translation
1. Firestore schema + the `translate` Server Action: cache check → pending-lock transaction → Gemini call → MDX parse-validation → store `complete`.
2. Public one-shot rate limiting via Firebase Anonymous Auth uid + App Check (one request per user per page per locale).
3. Wire the dropdown so it only offers controlled locales and triggers translation when a locale is missing; on success the page version persists for all users.
- **Verify:** as a visitor, pick a missing language → page translates once and renders; reload as a different user → served from cache, no new API call; confirm a second request from the same user is blocked; confirm JSX tags, slug, and URLs survived intact.

### Phase 6 — Offline bulk pre-translation script
1. `scripts/translate-mdx.mjs` reads `content/en/`, and for each target locale: **skips if Firestore already has a `complete` entry**, otherwise calls Gemini, validates MDX, and writes to Firestore. Uses the Google Cloud key from `.env.local`.
2. Same translate/preserve rules as the on-demand path; use `sourceHash` to detect changed sources.
- **Verify:** run the script for one locale; confirm new Firestore entries appear, existing ones are skipped, and the pages render in that locale on the live site.

---

**Do not start until I confirm the rules file is saved. Then begin Phase 0, Step 1, and report at each checkpoint.**
