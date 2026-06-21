import type { ReactNode } from "react";
import { PageTransition } from "@/components/PageTransition";

// template.tsx (not layout.tsx) remounts on every navigation, so the page
// transition plays per route. GlobalNav lives in layout.tsx, above this, so it
// stays put while the page content slides in.
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
