// Capture facade screenshots for sandbox embeds — one per device viewport.
//
// For each sandbox MDX with an `embed` URL, this screenshots the live app at
// three viewports and commits them, so each device frame shows the app's actual
// responsive layout:
//   public/sandbox/<slug>/app-shot-desktop.png   (1280px viewport)
//   public/sandbox/<slug>/app-shot-tablet.png    ( 768px viewport)
//   public/sandbox/<slug>/app-shot-mobile.png    ( 390px viewport)
// and sets embedPosterDesktop / …Tablet / …Mobile in the frontmatter.
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
const PUBLIC_DIR = path.join(ROOT, "public", "sandbox");

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

  const outDir = path.join(PUBLIC_DIR, slug);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`${slug}: capturing ${data.embed}`);
  for (const c of CAPTURES) {
    const outPath = path.join(outDir, `app-shot-${c.key}.png`);
    const bytes = await captureToFile(data.embed, c, outPath);
    console.log(`  ✓ ${c.key} (${c.viewportWidth}px vp) → app-shot-${c.key}.png (${Math.round(bytes / 1024)} KB)`);
  }

  // Point the per-device poster fields at the fresh captures (idempotent re-runs).
  raw = removeLine(raw, "embedPoster"); // retire the old single-shot field
  for (const c of CAPTURES) raw = removeLine(raw, `embedPoster${cap(c.key)}`);
  const block = CAPTURES.map(
    (c) => `embedPoster${cap(c.key)}: "/sandbox/${slug}/app-shot-${c.key}.png"`,
  ).join("\n");
  raw = raw.replace(/^(embed:.*)$/m, `$1\n${block}`);
  await fs.writeFile(file, raw);
  console.log(`  → set embedPosterDesktop / …Tablet / …Mobile`);
  projects++;
}

console.log(`\nDone. Captured ${projects * 3} screenshot(s) across ${projects} project(s).`);
if (onlySlug && !matched) console.log(`(No sandbox file named "${onlySlug}".)`);
