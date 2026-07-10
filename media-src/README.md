# `media-src/` — the image source-of-truth

Every image and video the site uses lives here, once, organized to mirror the
pages. **This whole folder is git-ignored** (except this README) — it never
ships in the repo or the deploy. It is your **staging + organization + upload
source** for Firebase Storage. The deployed site never reads it; it reads the
committed `?alt=media` Firebase URLs in the MDX/frontmatter.

> Why: Firebase App Hosting does **not** serve `public/…` (everything 404s on
> deploy). All media must be hosted on Firebase Storage `media/**` and referenced
> by URL. This folder is the local original of that remote tree. See
> `docs/MEDIA-PIPELINE.md`.

---

## The mirror

```
media-src/<area>/<slug>/<NN>-<label>.<ext>      (local, here)
        ⇩  strip the "NN-" prefix, swap "media-src" → "media"
     media/<area>/<slug>/<label>.<ext>          (Firebase object)
```

The **label is the Firebase object name**, so the object path — and therefore the
public URL — is decided entirely by `<label>.<ext>` and the folder. The `NN-`
number is a **local ordering aid only**; it never appears in the URL.

Areas: `home/`, `about/`, `projects/<slug>/`, `sandbox/<slug>/`, `blog/`.
The `<slug>` is the content file's slug (e.g. `src/content/en/sandbox/vendorpass.mdx`
→ `media-src/sandbox/vendorpass/`).

---

## Naming grammar — `NN-<label>.<ext>`

- **`NN`** — two digits, the **display order**. `00` = the card/thumbnail. Then
  `01, 02, 03, …` in the order the images appear on the page (cover set, then
  body top-to-bottom). Files sort into display order in Finder.
- **`<label>`** — kebab-case; **this is the Firebase object name**. Keep it stable
  to keep the URL stable.
- **`<ext>`** — exact. `.jpeg` ≠ `.jpg`; `.avif`, `.webp`, `.gif`, `.mp4` as-is.
- **Variants share a number** — a card's `-480` blur-up and its full image are one
  slot: `01-research-480.jpg` + `01-research.avif`.

---

## Four rules

1. **Copy per page, never share.** If the same photo appears on two pages, it is a
   **separate file** in each slug folder (two files → two Firebase objects → two
   URLs). No cross-page reuse of one object.
2. **Reuse within one page = one file.** A file used as both a cover and a body
   image keeps **one** number (its earliest/cover slot). Its body position is set
   by the order of its `<MDXImage>` tag in the MDX — the number does not mirror the
   body order for that file.
3. **Order of truth is the committed content.** Because this folder is git-ignored,
   the live order comes from the committed frontmatter/arrays/MDX tag order — the
   `NN` here is a shadow of that. Keep them matching by hand.
4. **Extensions and labels are load-bearing** — they define the URL. Don't
   normalize `.jpeg`→`.jpg` or rename a label unless you intend a URL change (and
   then you must re-upload + repoint content + delete the old object).

---

## Everyday moves

- **Replace an image** → drop the new file in with the **same `NN-<label>.ext`**,
  run the sync. Same object overwritten → **same URL → no content edit.**
- **Add an image** → give it the next free number, add its `<MDXImage>`/array entry
  in the MDX with its Firebase URL, sync, verify `200`.
- **Reorder** → renumber the local files (keeps this folder tidy) **and** reorder
  the committed content (the array / the `<MDXImage>` tags) — that is what the site
  actually reads. A pure reorder needs no re-upload (labels/URLs are unchanged).

---

## Sync to Firebase

```bash
node scripts/upload-media.mjs            # uploads every media-src file to media/…
node scripts/upload-media.mjs --dry-run  # show what would upload (+ orphans on Firebase)
```

It uploads with your `firebase login` credentials (owner) and prints an orphan
report. Then **`curl` each new URL for `200`** before committing the content that
references it. Never reference a URL before its file is uploaded.
