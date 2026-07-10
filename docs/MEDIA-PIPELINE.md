# Media pipeline — images & video

**Read this before you add, move, capture, or fix any image or video.**

It exists because media in this project has broken repeatedly for one reason: the
deploy target (Firebase **App Hosting**) does not serve images the way `next dev`
does. Every rule below is **verified against the live site** — see _How to
re-verify_ at the bottom.

---

## ✅ The one rule

> **Every content image and video is hosted on Firebase Storage under `media/…`,
> referenced by its full `?alt=media` URL, and uploaded _before_ it is
> referenced. Never reference a local `public/…` path — or the image optimizer —
> from committed content.**

Follow it → images work in local dev **and** on the deployed site.
Break it → they 404 in one or both.

---

## Why — App Hosting constraints (all verified on the live site)

| | Local dev (`next dev`) | Deployed (App Hosting) |
|---|---|---|
| `next/image` optimizer (`/_next/image`) | ✅ works | ❌ **404** (optimizer disabled) |
| Local `public/…` path (`/sandbox/x.jpg`) | ✅ served | ❌ **404** (not served) |
| Remote URL (`https://…`) | ✅ works | ✅ works (served raw) |

Consequences:

- On the deployed site, `next/image` emits a **raw `<img src="https://…">`** (no
  optimization). The `src` must therefore be a reachable **absolute URL**.
- A local path becomes `<img src="/sandbox/…">` → **404 on deploy**.
- ⇒ **All content media must be remote (Firebase). Never local.**

⚠️ Local dev is more forgiving (it optimizes and serves `public/`). So
**"it renders locally" does NOT mean "it renders deployed."** Always verify the
remote URL (below).

---

## Where media lives

- **Bucket:** `daechankimdesign-2026.firebasestorage.app`
- **Path convention:** `media/sandbox/<slug>/<file>` — mirror the content slug.
  (Other areas: `media/<area>/…`.)
- **Access (`storage.rules`):** `media/**` is **public-read**, **client-write-
  denied**. Uploads are done as the **project owner** — see _Uploading_ below.
- **Local source of truth:** the **git-ignored `media-src/`** folder holds the
  original of every object, mirroring this tree with a numeric display-order
  prefix (`media-src/<area>/<slug>/<NN>-<label>.<ext>` → `media/<area>/<slug>/<label>.<ext>`).
  It is the organize + upload source — **read `media-src/README.md`**. Sync it with
  `node scripts/upload-media.mjs` (`--dry-run` to preview + list orphans).

## Uploading

`media/**` denies client writes, so upload with owner credentials one of two ways:

- **A — Manual (always works, no setup):** Firebase console → Storage → open or
  create `media/sandbox/<slug>/` → drag the file(s) in. Best for one or a few.
- **B — Automated (bulk):** a Node script (`scripts/upload-media.mjs`) that mints
  an access token from your `firebase login` (`~/.config/configstore/firebase-tools.json`)
  and `PUT`s each file to the GCS upload API — owner IAM bypasses the deny-write
  rule. A prior session used this to migrate ~20 assets. **It reads your stored
  Firebase credential, so it needs your explicit go-ahead** (and is blocked as
  "credential access" under auto-approval). This machine has no `gsutil`/`gcloud`,
  and the `firebase` CLI has no Storage-upload command, so B is the automated path.

Either way: **upload, then reference, then `curl` for `200`** (below).

---

## The canonical URL

```
https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/<OBJECT_PATH_ENCODED>?alt=media
```

- `<OBJECT_PATH_ENCODED>` = the object path with **every `/` written as `%2F`**.
  - Object `media/sandbox/park/hero.jpg` → `media%2Fsandbox%2Fpark%2Fhero.jpg`
- End with `?alt=media`. **No token needed** — `media/**` is public-read.

---

## Process — adding an image (in this order)

1. **Produce the file**; put it in `media-src/<area>/<slug>/<NN>-<label>.<ext>`
   with the next display-order number (see `media-src/README.md`). This is the
   original — **not** referenced by content.
2. **Upload it to Firebase:** `node scripts/upload-media.mjs` (syncs all of
   media-src; strips the `NN-` prefix → `media/<area>/<slug>/<label>.<ext>`). Or
   console → Storage for a one-off.
3. **Reference it** by the canonical URL in frontmatter / MDX.
4. **VERIFY — the step that prevents every past breakage:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" "<the full ?alt=media URL>"   # must be 200
   ```
   `404` ⇒ not uploaded, or wrong path/encoding. Fix before moving on. Do this for
   **every** image you add or change.

**Never put the URL in content before the file is uploaded.** A `?alt=media` URL to
a not-yet-uploaded file 404s everywhere — this is the exact bug that keeps
recurring.

---

## Which component

| Use | For | Notes |
|---|---|---|
| `<MDXImage src alt width height />` | body images in MDX | **Always pass the image's real pixel `width`/`height`** so the aspect ratio is correct — don't let it default to 16:9. |
| `<Gallery images={[…]} />` | image grids | square-cropped grid |
| `<VideoPlayer type="video" src=… />` | video | src **must be `.mp4`** (Safari won't play `.webm`); host on Firebase |
| `SandboxEmbed` (frontmatter `embed`) | live demo + device facades | facade posters via `embedPosterDesktop/Tablet/Mobile` — also Firebase URLs |

All of these render as raw `<img>`/`<video>`/`<iframe>` with the remote `src` on
deploy, so all obey the one rule.

---

## Format & size

- **Static:** `.jpg` (photos/screenshots) or `.png` (UI w/ text or transparency).
- **Video:** `.mp4` (H.264) — **not `.webm`** (no Safari). Convert before upload.
- Keep files reasonable (screenshots ≤ ~1 MB) — they're served **raw** (no
  optimization on deploy).

---

## next.config remotePatterns

Any **new** remote image host used with `next/image` must be added to
`images.remotePatterns` in `next.config.ts`. Present today:
`firebasestorage.googleapis.com`, `*.firebasestorage.app`, `framerusercontent.com`,
`placehold.co`, `picsum.photos`. (Plain `<img>` — facade, `VideoPlayer` — doesn't
strictly need it, but list new hosts anyway.)

---

## Screenshots / captures

`npm run screenshots [slug]` captures device shots of a sandbox `embed`, writes
them to `media-src/sandbox/<slug>/0N-app-shot-*.png`, and sets `embedPoster*` to
their **Firebase URLs**. After running it: **(1)** `node scripts/upload-media.mjs`
to push the files, **(2)** `curl` each `embedPoster*` URL for `200`. The URLs are
already correct; they just 404 until the upload runs.

---

## ❌ Never do

- Reference a Firebase URL **before** uploading the file.
- Use a local `public/…` path in **committed content** (404s on deploy).
- Assume "renders locally" ⇒ "renders deployed" — always `curl` the URL.
- Use `.webm` for `VideoPlayer` (Safari).
- Rely on `/_next/image` / next-image optimization on the deploy.

---

## 🤖 AI / Claude checklist (every image or video task)

1. Is the file uploaded to `media/…`? → `curl "<url>"` returns `200`. If not,
   **upload first** (or, if you can't, STOP — see 7).
2. Does the content reference the **full `?alt=media` URL** (not a local path)?
3. MDX body image → correct real `width`/`height`?
4. Video → `.mp4`?
5. New remote host → added to `remotePatterns`?
6. **`curl` every media URL → `200`** before reporting done.
7. **Uploading** (see _Uploading_): console (A) for a few; offer the token script
   (B) for bulk — B needs the user's OK (reads their Firebase credential). Never
   silently leave a `?alt=media` URL pointing at a not-yet-uploaded file — upload
   first, or tell the user exactly what to upload where. Local paths are for
   temporary local preview only; flag loudly that they 404 on deploy.

---

## How to re-verify these facts

```bash
LIVE=https://daechankimdesign-website--daechankimdesign-2026.us-east4.hosted.app
curl -s -o /dev/null -w "%{http_code}\n" "$LIVE/_next/image?url=%2Fnext.svg&w=64&q=75"  # 404 → optimizer off
curl -s -o /dev/null -w "%{http_code}\n" "$LIVE/next.svg"                                # 404 → public/ not served
curl -s "$LIVE/" | grep -c "/_next/image"                                               # 0   → raw srcs only
```

_Verified 2026-07-04 against the live App Hosting deploy._
