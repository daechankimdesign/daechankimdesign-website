<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Continuing this project

Read **`CHANGELOG.md`** before starting work — its _Status_ section is the
source of truth for what's built, the current state of each phase, the deploy
model, and the next steps. When you ship a meaningful change, append a log entry
to keep it current.

Other key references: `portfolio-master-prompt.md` (the phased plan),
`portfolio-project-rules.md` (design system + i18n rules), `docs/STACK-NOTES-2026.md`
(verified stack notes).

# ⚠️ Images & video — READ BEFORE TOUCHING ANY MEDIA

**Read `docs/MEDIA-PIPELINE.md` before you add, move, capture, or fix any image
or video.** This has broken repeatedly. The short version:

- The deploy (App Hosting) **does not serve local `public/…` paths and disables
  the image optimizer** — verified on the live site. Only **remote URLs work**.
- ⇒ All content media lives on **Firebase Storage** (`media/…`), referenced by its
  full `?alt=media` URL, and **uploaded _before_ it is referenced.**
- **"Renders locally" ≠ "renders deployed."** Always `curl` the URL for `200`
  before calling an image task done. Uploads are manual (Firebase console) — this
  machine has no `gsutil`/`gcloud`, and the `firebase` CLI can't upload Storage
  files.

Full rules, URL format, per-component guidance, and the verification checklist are
in `docs/MEDIA-PIPELINE.md`.
