"use client";

import { useState } from "react";

type DeviceKey = "desktop" | "tablet" | "mobile";

type SandboxEmbedProps = {
  /** Live demo URL. Absent/empty → nothing renders (e.g. a Chrome extension). */
  src?: string;
  /** Accessible title for the iframe / launch button. */
  title?: string;
  /** Per-device facade screenshots — the matching one shows in each frame. */
  posters?: Partial<Record<DeviceKey, string>>;
  /** Single facade screenshot fallback when a device has no `posters` entry. */
  poster?: string;
  /** Constant frame (screen) height in px — shared by every device. Default 720. */
  height?: number;
};

// Dark bezel thickness around the screen, in px (kept in sync with the p-3 below
// so the outer width math lines up under border-box sizing).
const BEZEL = 12;

/**
 * Interactive project embed for sandbox pages. A Desktop / Tablet / Mobile toggle
 * resizes a device-styled frame: every device keeps the SAME height, and the
 * width follows the device's aspect ratio, so the frames hold true device
 * proportions (wide desktop, 3:4 tablet, tall phone) without the page jumping.
 * The live iframe reflows to the new width, so readers see the responsive layouts.
 *
 * The frame is a thick, deep-dark (`bg-fg`), rounded bezel imitating the device —
 * the corner radius sharpens/rounds per device. No `src` → renders nothing.
 *
 * Click-to-load facade: the heavy app only loads on "Launch". An "Open" (new tab)
 * escape hatch always shows — some hosts forbid framing, and demos want room.
 */
export function SandboxEmbed({
  src,
  title = "Interactive demo",
  posters,
  poster,
  height = 720,
}: SandboxEmbedProps) {
  const [live, setLive] = useState(false);
  const [device, setDevice] = useState<DeviceKey>("desktop");

  // No live demo to run → render nothing at all.
  if (!src) return null;

  // Same height for all; width = height × device aspect ratio (desktop fills).
  const DEVICES = [
    { key: "desktop", label: "Desktop", ratio: null, Icon: MonitorIcon, frame: "rounded-2xl", screen: "rounded-lg" },
    { key: "tablet", label: "Tablet", ratio: 0.75, Icon: TabletIcon, frame: "rounded-[1.75rem]", screen: "rounded-xl" },
    { key: "mobile", label: "Mobile", ratio: 0.5, Icon: PhoneIcon, frame: "rounded-[2.5rem]", screen: "rounded-[1.6rem]" },
  ] as const;

  const current = DEVICES.find((d) => d.key === device) ?? DEVICES[0];
  const screenW = current.ratio ? Math.round(height * current.ratio) : null;
  // The capture taken at this device's viewport (falls back to the single shot).
  const shot = posters?.[device] ?? poster;

  return (
    <div className="my-8">
      {/* Device toggle — resizes the frame below to each viewport */}
      <div className="mb-4 hidden justify-center sm:flex">
        <div
          role="group"
          aria-label="Preview device size"
          className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-subtle p-1"
        >
          {DEVICES.map((d) => {
            const active = d.key === device;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDevice(d.key)}
                aria-pressed={active}
                className={`text-caption inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  active ? "bg-fg text-canvas" : "text-fg-muted hover:text-fg"
                }`}
              >
                <d.Icon />
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Device frame — thick, deep-dark, rounded bezel; width tracks the ratio */}
      <div
        className={`mx-auto box-border max-w-full bg-fg p-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] transition-[width,border-radius] duration-300 ease-out ${current.frame}`}
        style={{ width: screenW ? screenW + BEZEL * 2 : "100%" }}
      >
        {/* Screen */}
        <div
          className={`relative w-full overflow-hidden bg-canvas transition-[border-radius] duration-300 ease-out ${current.screen}`}
          style={{ height }}
        >
          {live ? (
            <iframe
              src={src}
              title={title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              // Own projects, but keep the boundary explicit. allow-same-origin +
              // allow-scripts is needed for most SPAs to boot (storage, workers).
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-pointer-lock allow-downloads"
              className="absolute inset-0 h-full w-full border-0 bg-canvas"
            />
          ) : (
            <button
              type="button"
              onClick={() => setLive(true)}
              aria-label={`Launch ${title}`}
              className="group absolute inset-0 block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
            >
              {shot ? (
                // eslint-disable-next-line @next/next/no-img-element -- static screenshot preview; next/image adds no value in the facade
                <img
                  src={shot}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <span className="absolute inset-0 bg-surface-subtle" />
              )}
              {/* Launch affordance over the static screenshot */}
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-fg/5 transition-colors duration-200 group-hover:bg-fg/15">
                <span className="inline-flex items-center gap-2 rounded-full bg-fg/90 px-5 py-2.5 text-canvas shadow-sm backdrop-blur-sm transition-transform duration-200 group-hover:scale-[1.03]">
                  <PlayTriangle />
                  <span className="text-body font-medium">
                    Launch interactive demo
                  </span>
                </span>
                <span className="text-caption rounded-full bg-canvas/80 px-2.5 py-1 text-fg-muted backdrop-blur-sm">
                  Click to run it live
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Open in new tab — always available (framing can be blocked; demos want room) */}
      <div className="mt-3 flex justify-center">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption inline-flex items-center gap-1 text-fg-muted transition-colors hover:text-fg"
        >
          Open in new tab
          <ArrowUpRight />
        </a>
      </div>
    </div>
  );
}

function PlayTriangle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}
