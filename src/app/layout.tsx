import type { ReactNode } from "react";

// Root layout is a pass-through: <html>/<body> are rendered in
// app/[locale]/layout.tsx so the lang attribute reflects the active locale
// (the canonical next-intl App Router pattern).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
