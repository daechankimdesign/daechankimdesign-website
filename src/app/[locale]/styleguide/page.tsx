import type { Metadata } from "next";
import { LinkButton } from "@/components/LinkButton";

export const metadata: Metadata = {
  title: "Styleguide — Design System",
};

/* --- Token data (class names are static strings so Tailwind detects them) --- */

const TYPE_LEVELS = [
  { cls: "text-display", name: "Display", spec: "fluid 26→36 · Medium · tracking -0.04em" },
  { cls: "text-h1", name: "H1", spec: "fluid 22→28 · Semibold · tracking -0.03em" },
  { cls: "text-h2", name: "H2", spec: "fluid 20→24 · Semibold · tracking -0.03em" },
  { cls: "text-sub-display", name: "Sub-display", spec: "fluid 20→24 · Regular (H2 size, lighter)" },
  { cls: "text-h3", name: "H3", spec: "fluid 18→20 · Medium · tracking -0.03em" },
  { cls: "text-body", name: "Body", spec: "16px / Regular · line-height 1.6" },
  { cls: "text-caption", name: "Caption", spec: "12px / Regular · ALL CAPS · meta labels, small tags" },
  { cls: "text-note", name: "Note", spec: "12px / Regular · sentence case · figcaptions, notices, dates" },
] as const;

// Hex labels list light then dark (the swatches themselves render the ACTIVE
// theme's token, so the pair keeps the caption truthful in both themes).
const COLORS = [
  { name: "fg", hex: "#1E1E1E · dark #E8E6E3", use: "Primary text / ink", swatch: "bg-fg" },
  { name: "fg-muted", hex: "#6F6F6F · dark #A5A29D", use: "Secondary text, inactive nav, meta values", swatch: "bg-fg-muted" },
  { name: "fg-subtle", hex: "#B3B3B3 · dark #6B6863", use: "Tertiary / disabled", swatch: "bg-fg-subtle" },
  { name: "hairline", hex: "#D9D9D9 · dark #383633", use: "Hairline borders", swatch: "bg-hairline" },
  { name: "surface", hex: "#E3E3E3 · dark #2E2C29", use: "Active pill / raised surface", swatch: "bg-surface" },
  { name: "surface-subtle", hex: "#F5F5F5 · dark #232120", use: "Subtle background blocks", swatch: "bg-surface-subtle" },
  { name: "canvas", hex: "#F8FAFC · dark #161B22", use: "Page background", swatch: "bg-canvas" },
] as const;

const SPACING = [
  { px: "4px", token: "p-1 / gap-1", w: "w-1" },
  { px: "8px", token: "p-2 / gap-2", w: "w-2" },
  { px: "12px", token: "p-3 / gap-3", w: "w-3" },
  { px: "16px", token: "p-4 / gap-4", w: "w-4" },
  { px: "24px", token: "p-6 / gap-6", w: "w-6" },
  { px: "32px", token: "p-8 / gap-8", w: "w-8" },
  { px: "48px", token: "p-12 / gap-12", w: "w-12" },
  { px: "60px", token: "p-15 (container)", w: "w-15" },
] as const;

const HAIRLINES = [
  { name: "hairline-t", cls: "hairline-t" },
  { name: "hairline-b", cls: "hairline-b" },
  { name: "hairline-l", cls: "hairline-l" },
  { name: "hairline-r", cls: "hairline-r" },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption text-fg-muted uppercase tracking-[0.08em] mb-6">
      {children}
    </p>
  );
}

export default function Styleguide() {
  return (
    <main className="container-page py-16">
      <header className="mb-16">
        <h1 className="text-display">Design System</h1>
        <p className="text-body text-fg-muted mt-2 measure-lede">
          Phase 1 styleguide — every typography level, color, spacing token, and
          the hairline border. Built strictly on the Figma Simple Design System
          neutral palette. Resize the window to watch the fluid type resolve to
          whole-integer pixels.
        </p>
      </header>

      {/* Typography */}
      <section className="mb-20">
        <SectionLabel>Typography — Noto Sans</SectionLabel>
        <div className="flex flex-col gap-8">
          {TYPE_LEVELS.map((t) => (
            <div key={t.name} className="hairline-b pb-8">
              <div className={`${t.cls} text-fg`}>
                Daechan Kim — product designer
              </div>
              <p className="text-note text-fg-muted mt-3">
                <span className="text-fg">{t.name}</span> · {t.spec} ·{" "}
                <code>.{t.cls}</code>
              </p>
            </div>
          ))}
        </div>
        <p className="text-note text-fg-muted mt-6">
          Links are underline-only and inherit color, with no hover color change:{" "}
          <a href="/styleguide" className="link">
            this is a link
          </a>
          .
        </p>
      </section>

      {/* Color */}
      <section className="mb-20">
        <SectionLabel>Color — Simple Design System neutrals</SectionLabel>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {COLORS.map((c) => (
            <div key={c.name}>
              <div
                className={`${c.swatch} h-20 w-full rounded-sm border border-hairline`}
              />
              <p className="text-body text-fg mt-3">{c.name}</p>
              <p className="text-note text-fg-muted">
                {c.hex} · {c.use}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing */}
      <section className="mb-20">
        <SectionLabel>Spacing — strict 4px grid</SectionLabel>
        <div className="flex flex-col gap-4">
          {SPACING.map((s) => (
            <div key={s.px} className="flex items-center gap-4">
              <div className={`${s.w} h-6 bg-fg shrink-0`} />
              <p className="text-body text-fg">
                {s.px}{" "}
                <span className="text-fg-muted text-note">· {s.token}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Hairline */}
      <section className="mb-20">
        <SectionLabel>Hairline border — #D9D9D9, crisp 1-device-pixel</SectionLabel>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {HAIRLINES.map((h) => (
            <div key={h.name} className={`${h.cls} p-6`}>
              <p className="text-body text-fg">Aa</p>
              <p className="text-note text-fg-muted mt-2">.{h.name}</p>
            </div>
          ))}
          <div className="border border-hairline p-6">
            <p className="text-body text-fg">Aa</p>
            <p className="text-note text-fg-muted mt-2">border-hairline</p>
          </div>
        </div>
        <p className="text-note text-fg-muted mt-6 measure-lede">
          Single-side variants use a scaled pseudo-element (1 device pixel at 1×
          / 2× / 3×). For full boxes use Tailwind <code>border border-hairline</code>.
          Never a literal 0.6px border.
        </p>
      </section>

      {/* Link button */}
      <section className="mb-20">
        <SectionLabel>Link button — .link-button + .hairline-b</SectionLabel>
        <div className="flex flex-wrap items-start gap-10">
          <LinkButton href="/styleguide">Details</LinkButton>
          <LinkButton href="/styleguide">View project</LinkButton>
          <LinkButton href="https://example.com" external>
            External link
          </LinkButton>
        </div>
        <p className="text-note text-fg-muted mt-6 measure-lede">
          Text link styled as a control: <strong>8px</strong> block padding, an
          up-right arrow scaled to the text (<code>1em</code>), and a hairline
          bottom rule. Use the <code>LinkButton</code> component — locale-aware by
          default, <code>external</code> for out-of-app links (new tab).
        </p>
      </section>

      {/* Layout */}
      <section>
        <SectionLabel>Layout</SectionLabel>
        <p className="text-body text-fg measure-lede">
          <code>.container-page</code> — full width, max <strong>1440px</strong>,
          centered, with <strong>60px</strong> gutters on desktop and{" "}
          <strong>20px</strong> below 768px. This page uses it.
        </p>
      </section>
    </main>
  );
}
