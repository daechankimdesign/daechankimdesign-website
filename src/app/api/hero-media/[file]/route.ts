/**
 * Same-origin, edge-cached proxy for the home hero's images.
 *
 * WHY THIS EXISTS (two reasons, both verified with curl on 2026-10-09):
 *  1. The ID card is drawn in WebGL, and a WebGL texture may only use an image
 *     the page is allowed to READ. Firebase Storage sends no
 *     `access-control-allow-origin` on the GET, so a card photo loaded straight
 *     from Storage is unusable as a texture. Same story as /api/resume, where
 *     pdf.js hit the same wall.
 *  2. Storage serves every object with `cache-control: private, max-age=0`, and
 *     took 1.7–3.8s to the first byte for a 42KB file, so the hero's photos
 *     re-downloaded slowly on every visit. From here they go out with a
 *     one-year immutable Cache-Control, which the browser AND App Hosting's CDN
 *     honour, so Storage is hit about once per edge.
 *
 * Storage stays the source of truth (docs/MEDIA-PIPELINE.md): files are still
 * uploaded to media/home/hero/ and this only relays them. ALLOWLISTED, so it is
 * not an open proxy. Object names are treated as immutable: a changed image
 * gets a new label (media-src/README.md), never an overwrite.
 *
 * `api` is excluded from the next-intl matcher (proxy.ts), so this path is not
 * locale-rewritten.
 */

const STORAGE =
  "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fhome%2Fhero%2F";

const FILES: Record<string, string> = {
  // Wall photos (square crops): 1x / 2x.
  "research-sq160.jpg": "image/jpeg",
  "research-sq320.jpg": "image/jpeg",
  "stack-5-sq160.jpg": "image/jpeg",
  "stack-5-sq320.jpg": "image/jpeg",
  "critique-sq160.jpg": "image/jpeg",
  "critique-sq320.jpg": "image/jpeg",
  // ID card photo: 1x / 2x.
  "impact-sq320.jpg": "image/jpeg",
  "impact-sq480.jpg": "image/jpeg",
  // Lightbox (full size).
  "research.avif": "image/avif",
  "stack-5.jpg": "image/jpeg",
  "critique.jpg": "image/jpeg",
  "impact-1400.avif": "image/avif",
};

const YEAR = 60 * 60 * 24 * 365;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const type = FILES[file];
  if (!type) return new Response("Not found.", { status: 404, headers: { "Cache-Control": "no-store" } });

  const upstream = await fetch(`${STORAGE}${encodeURIComponent(file)}?alt=media`, {
    next: { revalidate: YEAR },
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Image is unavailable.", { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": `public, max-age=${YEAR}, s-maxage=${YEAR}, immutable`,
    },
  });
}
