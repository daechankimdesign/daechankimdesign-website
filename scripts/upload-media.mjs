// Upload media to Firebase Storage `media/…` using the local `firebase login`.
//
// `media/**` denies client writes (storage.rules), but the signed-in owner has
// Storage write via IAM. This reads ~/.config/configstore/firebase-tools.json,
// gets an access token (refreshing if needed), and uploads via the GCS JSON API.
// The token is used internally and never logged.
//
// TWO MODES:
//   1) SYNC media-src/ (default — the source-of-truth folder, see media-src/README.md):
//        node scripts/upload-media.mjs                 # upload every media-src file
//        node scripts/upload-media.mjs --dry-run       # show mapping + Firebase orphans
//      media-src/<area>/<slug>/<NN>-<label>.<ext> → media/<area>/<slug>/<label>.<ext>
//      (the NN- order prefix is stripped; the label is the object name).
//   2) EXPLICIT files (one-off):
//        node scripts/upload-media.mjs <bucket> <objectPrefix> <file...>
//
// Requires Node 22+ (global fetch) and a prior interactive `firebase login`.

import { promises as fs } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const BUCKET = "daechankimdesign-2026.firebasestorage.app";
// firebase-tools' public installed-app OAuth client (shipped in the npm package;
// not a real secret — it's how every `firebase` CLI refreshes its token).
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

async function getAccessToken() {
  const cfgPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  let cfg;
  try {
    cfg = JSON.parse(await fs.readFile(cfgPath, "utf8"));
  } catch {
    throw new Error(`Could not read ${cfgPath} — run \`firebase login\` first.`);
  }
  const tok = cfg.tokens ?? cfg.user?.tokens ?? {};
  if (tok.access_token && tok.expires_at && tok.expires_at > Date.now() + 60_000) {
    return tok.access_token;
  }
  if (!tok.refresh_token) {
    throw new Error(`No usable token in firebase-tools.json. Run \`firebase login\`.`);
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      refresh_token: tok.refresh_token, grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  if (!j.access_token) throw new Error("Token refresh returned no access_token.");
  return j.access_token;
}

const mimeFor = (f) => {
  const e = f.toLowerCase();
  if (e.endsWith(".png")) return "image/png";
  if (e.endsWith(".jpg") || e.endsWith(".jpeg")) return "image/jpeg";
  if (e.endsWith(".webp")) return "image/webp";
  if (e.endsWith(".avif")) return "image/avif";
  if (e.endsWith(".mp4")) return "video/mp4";
  if (e.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
};

async function put(token, name, file) {
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(name)}`;
  const body = await fs.readFile(file);
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": mimeFor(file) },
    body,
  });
  return { ok: res.ok, status: res.status, err: res.ok ? "" : (await res.text()).slice(0, 160), kb: Math.round(body.length / 1024) };
}

// ── mode 1: sync media-src/ ──────────────────────────────────────────────────
const SRC = path.join(process.cwd(), "media-src");
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name !== "README.md" && e.name !== ".DS_Store") out.push(p);
  }
  return out;
}
const toObject = (abs) => {
  const rel = path.relative(SRC, abs).split(path.sep);
  const file = rel.pop().replace(/^\d+-/, ""); // strip "NN-"
  return ["media", ...rel, file].join("/");
};

async function listRemote(token) {
  const objs = new Set();
  let pageToken = "";
  do {
    const u = `https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?prefix=media/&maxResults=1000${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(u, { headers: { authorization: `Bearer ${token}` } });
    const j = await res.json();
    (j.items || []).forEach((it) => objs.add(it.name));
    pageToken = j.nextPageToken || "";
  } while (pageToken);
  return objs;
}

async function sync(dryRun) {
  const files = walk(SRC);
  const wanted = new Map(files.map((f) => [toObject(f), f]));
  console.log(`${files.length} local files → ${wanted.size} objects\n`);
  const token = await getAccessToken();
  const remote = await listRemote(token);
  const orphans = [...remote].filter((o) => !wanted.has(o)).sort();

  if (dryRun) {
    for (const [obj, f] of wanted) console.log("  upload", path.relative(SRC, f), "→", obj);
    console.log(`\n${orphans.length} Firebase object(s) NOT in media-src (orphans — delete manually if stale):`);
    orphans.forEach((o) => console.log("   ⚠ ", o));
    console.log("\n(dry run — nothing uploaded)");
    return;
  }
  let ok = 0, fail = 0;
  for (const [obj, f] of wanted) {
    const r = await put(token, obj, f);
    if (r.ok) { ok++; process.stdout.write("."); } else { fail++; console.log(`\n  ✗ ${obj} -> ${r.status} ${r.err}`); }
  }
  console.log(`\n\n${ok} uploaded, ${fail} failed.`);
  if (orphans.length) {
    console.log(`\n${orphans.length} orphan(s) on Firebase not produced by media-src:`);
    orphans.forEach((o) => console.log("   ⚠ ", o));
  }
  console.log("\nVerify a few: curl the ?alt=media URL for 200 before committing content.");
}

// ── mode 2: explicit files ───────────────────────────────────────────────────
async function explicit(bucket, prefix, files) {
  const token = await getAccessToken();
  const clean = prefix.replace(/^\/+|\/+$/g, "");
  let ok = 0;
  for (const file of files) {
    const name = `${clean}/${path.basename(file)}`;
    const r = await put(token, name, file);
    if (r.ok) { console.log(`  ✓ ${name} (${r.kb} KB)`); ok++; }
    else console.error(`  ✗ ${name} -> ${r.status} ${r.err}`);
  }
  console.log(`\nUploaded ${ok}/${files.length} to gs://${bucket}/${clean}/`);
}

// ── dispatch ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "--dry-run" || args[0] === "--sync") {
  await sync(args.includes("--dry-run"));
} else {
  const [bucket, prefix, ...files] = args;
  if (!bucket || !prefix || files.length === 0) {
    console.error("usage:\n  node scripts/upload-media.mjs [--dry-run]           # sync media-src/\n  node scripts/upload-media.mjs <bucket> <prefix> <file...>  # explicit");
    process.exit(1);
  }
  await explicit(bucket, prefix, files);
}
