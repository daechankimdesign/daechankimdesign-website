import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
};

// No argument needed: ./src/i18n/request.ts is auto-detected.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
