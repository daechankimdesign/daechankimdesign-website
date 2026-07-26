import { RESUME_URL } from "@/lib/links";

/**
 * Same-origin proxy for the resume PDF.
 *
 * WHY THIS EXISTS: the viewer renders the PDF with pdf.js, which FETCHES the
 * bytes — unlike the <iframe> it replaced, which merely navigated a frame and so
 * never needed CORS. The Firebase Storage download endpoint answers the OPTIONS
 * preflight with `access-control-allow-origin: *` but sends NO such header on
 * the actual GET, so the browser blocks the read and pdf.js reports
 * "UnknownErrorException: Failed to fetch". Verified with:
 *   curl -sD - -H "Origin: http://localhost:3000" "<RESUME_URL>" | grep -i access-control
 * Fixing it at the source means setting a CORS config on the bucket, which needs
 * gsutil/gcloud — not available here (see docs/MEDIA-PIPELINE.md). Serving the
 * file from our own origin sidesteps CORS entirely and works identically in dev
 * and on App Hosting.
 *
 * Only the VIEWER goes through here. The "Open in new tab" link and the nav /
 * hero anchors still point straight at Storage: those are plain navigations,
 * which never needed CORS and shouldn't spend our egress.
 *
 * `api` is excluded from the next-intl matcher (see proxy.ts), so this path is
 * not locale-rewritten.
 */

// Revalidate hourly: the resume changes rarely, and this keeps us off Storage
// for every viewer open.
export const revalidate = 3600;

export async function GET(request: Request) {
  const upstream = await fetch(RESUME_URL, {
    next: { revalidate },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Resume is unavailable.", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // ?download=1 forces a save instead of rendering. This is the ONLY reliable
  // way to offer a download: the `download` attribute on an <a> is ignored for
  // cross-origin URLs, so a link straight to Storage can never force one.
  const download = new URL(request.url).searchParams.get("download") === "1";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="daechan-kim-resume.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
