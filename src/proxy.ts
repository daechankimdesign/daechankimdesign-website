import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed `middleware.ts` → `proxy.ts` (runs on the Node.js runtime).
// The import path stays `next-intl/middleware`.
export default createMiddleware(routing);

export const config = {
  // Match all paths except api, _next, _vercel, and files containing a dot.
  // This still matches "/" (required for localePrefix: "as-needed").
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
