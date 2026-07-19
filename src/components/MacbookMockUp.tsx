import type { ReactNode } from "react";

/**
 * A MacBook device frame. Adapted from a fixed-740px design to be fully fluid:
 * the root is a query container (`@container`) capped at 740px, and EVERY inner
 * dimension is expressed in `cqw` (1cqw = 1% of the root's width). At 740px each
 * cqw value resolves to the original pixel (e.g. 83.51cqw × 7.4 = 618px), so the
 * design is pixel-identical at full size; below 740px the whole laptop scales
 * down proportionally with no overflow and no breakpoints. Hairline borders and
 * sub-4px radii stay in px — they don't benefit from scaling and read crisper.
 *
 * Chrome, not content: the rounded screen + bezel are UI chrome (the device in
 * the picture), so the IMAGE-FRAME RULE's "flat, square content frames" doesn't
 * apply here — same license SandboxEmbed's device bezel takes.
 *
 * Pass `src`/`alt` for the default screen fill (object-cover, centered), or
 * `children` to render arbitrary content on the screen instead.
 */
export function MacbookMockUp({
  className,
  children,
  src,
  alt = "",
}: Readonly<{
  className?: string;
  children?: ReactNode;
  src?: string;
  alt?: string;
}>) {
  return (
    <div
      className={`@container relative z-[1] mx-auto w-full max-w-[740px] ${className ?? ""}`}
    >
      {/* Lid: dark bezel around the screen. */}
      <div className="relative z-[1] mx-auto h-[56.49cqw] w-[83.51cqw] overflow-hidden rounded-[2.7cqw] border-2 border-[rgb(200,202,203)] px-[1.22cqw] pt-[1.22cqw] pb-[3.11cqw] [background:rgb(13,13,13)]">
        {children ?? (
          <div className="relative h-[50.68cqw] w-full overflow-hidden rounded-t-[1.35cqw] border-2 border-[rgb(18,18,18)]">
            {/* Plain <img>, matching SandboxEmbed's device-screen fill: a direct
                remote URL that renders on App Hosting (the optimizer is off there,
                and next/image's own aspect box would fight this cover-crop). */}
            {/* eslint-disable-next-line @next/next/no-img-element -- device-screen fill; next/image adds no value and its optimizer is off on deploy */}
            <img
              alt={alt}
              src={src}
              width={1546}
              height={1384}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        )}
        {/* Screen bottom shadow. */}
        <div className="absolute right-0 bottom-0 left-0 h-[3.24cqw] bg-linear-to-b from-[#272727] to-[#0d0d0d]" />
      </div>

      {/* Camera / hinge tab peeking above the base. */}
      <div className="absolute top-[1.49cqw] left-2/4 z-[2] -ml-[4.32cqw] h-[1.62cqw] w-[8.65cqw] rounded-br rounded-bl bg-[rgb(13,13,13)]" />

      {/* Base / keyboard-deck front edge, full width. */}
      <div className="relative z-[9] -mt-[1.35cqw] h-[3.24cqw] w-full rounded-[2px_2px_12px_12px] border-[1px_2px_0px] border-[rgb(160,163,167)] border-solid shadow-[rgb(108,112,116)_0px_-2px_8px_0px_inset] [background:radial-gradient(circle,rgb(226,227,228)_85%,rgb(200,202,203)_100%)] [border-image:initial]">
        {/* Thumb notch. */}
        <div className="absolute top-0 left-1/2 -ml-[8.11cqw] h-[1.35cqw] w-[16.22cqw] rounded-b-[10px] shadow-[inset_0_0_4px_2px_#babdbf]" />
      </div>

      {/* Front feet. */}
      <div className="absolute -bottom-0.5 left-[6.49cqw] h-0.5 w-[5.41cqw] rounded-b-full bg-neutral-600" />
      <div className="absolute -bottom-0.5 right-[6.49cqw] h-0.5 w-[5.41cqw] rounded-b-full bg-neutral-600" />
    </div>
  );
}
