import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Legacy flat case-study slugs (the former /project/[slug] pages). Enumerated so
// the redirect matches ONLY these known URLs and can never shadow the new
// /project/case-study or /project/play sub-roots. New case studies are authored
// directly under the new structure and never had a flat URL, so they don't belong
// here. Keep in sync with src/content/en/projects/*.mdx if a legacy slug changes.
const LEGACY_CASE_STUDY_SLUGS = [
  "accelerating-institutions-to-preserve-the-local-history",
  "democratizing-storytelling-for-minorities-using-explorative-llm",
  "translate-furniture-as-a-service-to-tackle-social-phenomenon",
];
const caseStudyMatch = LEGACY_CASE_STUDY_SLUGS.join("|");

const nextConfig: NextConfig = {
  // This project lives under ~/Desktop, which is synced to iCloud. iCloud's file
  // provider races with Turbopack's rapid cache writes and corrupts them
  // ("Unable to write SST file: No such file or directory"), 500-ing every route.
  // A dir whose name ends in `.nosync` is excluded from iCloud, so dev writes its
  // cache there. Production build keeps the default `.next` (App Hosting expects it).
  distDir: process.env.NODE_ENV === "development" ? ".next.nosync" : ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  // Old /sandbox and flat /project/[slug] URLs → the merged /project structure.
  // Config redirects run BEFORE the next-intl proxy on the RAW path (Next 16
  // order: headers → redirects → proxy), so each rule needs a bare (en, no
  // prefix — localePrefix "as-needed") form and an explicit /:locale(ko|es) form
  // whose destination re-emits the prefix. 308 permanent. Slugs are English in
  // every locale, so they map 1:1.
  async redirects() {
    return [
      // Sandbox index → unified Work index.
      { source: "/sandbox", destination: "/project", permanent: true },
      {
        source: "/:locale(ko|es)/sandbox",
        destination: "/:locale/project",
        permanent: true,
      },
      // Sandbox detail → Play detail.
      {
        source: "/sandbox/:slug",
        destination: "/project/play/:slug",
        permanent: true,
      },
      {
        source: "/:locale(ko|es)/sandbox/:slug",
        destination: "/:locale/project/play/:slug",
        permanent: true,
      },
      // Legacy flat case-study detail → nested Case Study detail (known slugs only).
      {
        source: `/project/:slug(${caseStudyMatch})`,
        destination: "/project/case-study/:slug",
        permanent: true,
      },
      {
        source: `/:locale(ko|es)/project/:slug(${caseStudyMatch})`,
        destination: "/:locale/project/case-study/:slug",
        permanent: true,
      },
    ];
  },
};

// No argument needed: ./src/i18n/request.ts is auto-detected.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
