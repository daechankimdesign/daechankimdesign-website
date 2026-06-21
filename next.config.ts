import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      { protocol: "https", hostname: "framerusercontent.com" },
    ],
  },
};

// No argument needed: ./src/i18n/request.ts is auto-detected.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
