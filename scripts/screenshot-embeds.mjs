// Capture facade screenshots for sandbox embeds — one per device viewport.
//
// For each sandbox MDX with an `embed` URL, this screenshots the live app at
// three viewports into the media-src/ source-of-truth, so each device frame
// shows the app's actual responsive layout:
//   media-src/sandbox/<slug>/01-app-shot-desktop.png   (1280px viewport)
//   media-src/sandbox/<slug>/02-app-shot-tablet.png    ( 768px viewport)
//   media-src/sandbox/<slug>/03-app-shot-mobile.png    ( 390px viewport)
// and sets embedPosterDesktop / …Tablet / …Mobile to their Firebase URLs. Then
// run `node scripts/upload-media.mjs` to push the files and curl-verify 200.
//
// Rendering is done by thum.io (executes the SPA's JS, no API key). It generates
// asynchronously, so the first hits return a placeholder GIF — we poll past it.
//
// Usage:
//   node scripts/screenshot-embeds.mjs            # every sandbox file with an embed
//   node scripts/screenshot-embeds.mjs <slug>     # just one
//
// Requires Node 22+ (global fetch/Buffer). Only dep is gray-matter.

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const SANDBOX_DIR = path.join(ROOT, "src", "content", "en", "sandbox");
// Captures land in the git-ignored media-src/ source-of-truth, as poster slots
// 01/02/03 (after the 00 thumbnail). Frontmatter is set to the Firebase URLs;
// run `node scripts/upload-media.mjs` to push the files, then curl-verify 200.
const MEDIA_SRC_DIR = path.join(ROOT, "media-src", "sandbox");
const BUCKET = "daechankimdesign-2026.firebasestorage.app";
const POSTER_NN = { desktop: "01", tablet: "02", mobile: "03" };
const firebaseUrl = (obj) =>
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(obj)}?alt=media`;

const onlySlug = process.argv[2];
const WAIT = 8; // seconds for the SPA to render before the frame is taken

// One capture per device. `viewportWidth` drives the app's responsive layout;
// width × crop set the output aspect to match the frame it fills (desktop ≈ 5:4,
// tablet 3:4, mobile ≈ 1:2) so object-cover in the facade barely crops.
const CAPTURES = [
  { key: "desktop", viewportWidth: 1280, width: 1280, crop: 1024 },
  { key: "tablet", viewportWidth: 768, width: 768, crop: 1024 },
  { key: "mobile", viewportWidth: 390, width: 390, crop: 780 },
];

const cap = (s) => s[0].toUpperCase() + s.slice(1);

const thumUrl = (target, c) =>
  `https://image.thum.io/get/viewportWidth/${c.viewportWidth}/width/${c.width}/crop/${c.crop}/wait/${WAIT}/${target}`;

async function captureToFile(target, c, outPath) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    const res = await fetch(thumUrl(target, c), { redirect: "follow" });
    const type = res.headers.get("content-type") || "";
    const buf = Buffer.from(await res.arrayBuffer());
    // The placeholder is an animated GIF; a real shot is PNG/JPEG and larger.
    if (res.ok && !type.includes("gif") && buf.length > 3000) {
      await fs.writeFile(outPath, buf);
      return buf.length;
    }
    process.stdout.write(`    …still generating (attempt ${attempt}, ${type})\n`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error(`Timed out waiting for a real screenshot of ${target}`);
}

// Targeted frontmatter edit — a full gray-matter re-stringify would drop the
// `# …` comments and reorder keys. Removes a `key:` line if present.
function removeLine(raw, key) {
  return raw.replace(new RegExp(`^${key}:.*\\n?`, "m"), "");
}

const files = (await fs.readdir(SANDBOX_DIR)).filter((f) => f.endsWith(".mdx"));
let projects = 0;
let matched = false;

for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  if (onlySlug && slug !== onlySlug) continue;
  matched = true;

  const file = path.join(SANDBOX_DIR, f);
  let raw = await fs.readFile(file, "utf8");
  const { data } = matter(raw);
  if (!data.embed) {
    if (onlySlug) console.log(`${slug}: no 'embed' URL — nothing to capture.`);
    continue;
  }

  const outDir = path.join(MEDIA_SRC_DIR, slug);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`${slug}: capturing ${data.embed}`);
  for (const c of CAPTURES) {
    const name = `${POSTER_NN[c.key]}-app-shot-${c.key}.png`;
    const outPath = path.join(outDir, name);
    const bytes = await captureToFile(data.embed, c, outPath);
    console.log(`  ✓ ${c.key} (${c.viewportWidth}px vp) → ${name} (${Math.round(bytes / 1024)} KB)`);
  }

  // Point the per-device poster fields at the Firebase URLs (idempotent re-runs).
  // The object name has no NN- prefix, so the URL is stable across re-numbering.
  raw = removeLine(raw, "embedPoster"); // retire the old single-shot field
  for (const c of CAPTURES) raw = removeLine(raw, `embedPoster${cap(c.key)}`);
  const block = CAPTURES.map(
    (c) => `embedPoster${cap(c.key)}: "${firebaseUrl(`media/sandbox/${slug}/app-shot-${c.key}.png`)}"`,
  ).join("\n");
  raw = raw.replace(/^(embed:.*)$/m, `$1\n${block}`);
  await fs.writeFile(file, raw);
  console.log(`  → set embedPoster* to Firebase URLs — run scripts/upload-media.mjs, then curl 200`);
  projects++;
}

console.log(`\nDone. Captured ${projects * 3} screenshot(s) across ${projects} project(s).`);
if (onlySlug && !matched) console.log(`(No sandbox file named "${onlySlug}".)`);
