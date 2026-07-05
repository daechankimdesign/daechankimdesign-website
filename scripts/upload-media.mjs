// Upload files to Firebase Storage `media/…` using the local `firebase login`.
//
// `media/**` denies client writes (storage.rules), but the signed-in owner has
// Storage write via IAM. This reads ~/.config/configstore/firebase-tools.json,
// gets an access token (refreshing if needed), and uploads via the GCS JSON API.
// It prints status only — the token is used internally and never logged.
//
// Usage:
//   node scripts/upload-media.mjs <bucket> <objectPrefix> <file...>
//   node scripts/upload-media.mjs daechankimdesign-2026.firebasestorage.app \
//        media/sandbox/<slug> public/sandbox/<slug>/a.jpg public/sandbox/<slug>/b.jpg
//
// Requires Node 22+ (global fetch) and a prior interactive `firebase login`.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const [bucket, prefix, ...files] = process.argv.slice(2);
if (!bucket || !prefix || files.length === 0) {
  console.error("usage: node scripts/upload-media.mjs <bucket> <objectPrefix> <file...>");
  process.exit(1);
}

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
  // A still-valid stored access token avoids a refresh round-trip.
  if (tok.access_token && tok.expires_at && tok.expires_at > Date.now() + 60_000) {
    return tok.access_token;
  }
  if (!tok.refresh_token) {
    throw new Error(
      `No usable token in firebase-tools.json (top-level keys: ${Object.keys(cfg).join(", ")}). Run \`firebase login\`.`,
    );
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tok.refresh_token,
      grant_type: "refresh_token",
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
  if (e.endsWith(".mp4")) return "video/mp4";
  if (e.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
};

const token = await getAccessToken();
const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
let ok = 0;

for (const file of files) {
  const name = `${cleanPrefix}/${path.basename(file)}`;
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(name)}`;
  const body = await fs.readFile(file);
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": mimeFor(file) },
    body,
  });
  if (res.ok) {
    console.log(`  ✓ ${name} (${Math.round(body.length / 1024)} KB)`);
    ok++;
  } else {
    console.error(`  ✗ ${name} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
}

console.log(`\nUploaded ${ok}/${files.length} to gs://${bucket}/${cleanPrefix}/`);
