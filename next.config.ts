import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

// No argument needed: ./src/i18n/request.ts is auto-detected.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
