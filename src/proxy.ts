import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed `middleware.ts` → `proxy.ts` (runs on the Node.js runtime).
// The import path stays `next-intl/middleware`.
export default createMiddleware(routing);

export const config = {
  // Match all paths except api, _next, _vercel, and files containing a dot.
  // `ingest` is excluded so the PostHog reverse proxy (next.config rewrites
  // /ingest/* -> PostHog) isn't intercepted by next-intl and rewritten to
  // /en/ingest/* — which would 404 every analytics request and silently drop
  // all events. Keep in sync with the /ingest rewrites in next.config.ts.
  // This still matches "/" (required for localePrefix: "as-needed").
  matcher: "/((?!api|trpc|_next|_vercel|ingest|.*\\..*).*)",
};
