"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// SAME-ORIGIN, deliberately: pdf.js fetches the bytes, and the Storage endpoint
// sends no access-control-allow-origin on the GET, so a direct cross-origin
// fetch is blocked by the browser. This route streams the same file from our own
// origin — see src/app/api/resume/route.ts for the full reasoning.
const RESUME_SRC = "/api/resume";

/* ============================================================================
   The resume page, rendered NATIVELY into the DOM by react-pdf (pdf.js) — a
   <canvas> plus a text layer and an annotation layer — instead of an <iframe>.
   That removes the browser PDF viewer's own chrome and dark backdrop entirely,
   so the page sits on the sheet as plain paper (see ResumeModal).

   Why the wrapper rather than pdfjs-dist by hand: this document needs three
   things react-pdf already owns — cancelling the in-flight RenderTask when the
   width changes or the sheet unmounts (the sheet resizes at the 640px
   breakpoint, and StrictMode double-mounts in dev), the TEXT layer (selectable
   / copyable), and the ANNOTATION layer (the resume carries real links — the
   DOI, the email, the site — which on a bare canvas would be dead pixels, a
   regression from the iframe this replaces).

   This file is loaded via next/dynamic from ResumeModal, so pdf.js (the bulk of
   the weight) is fetched on first open and never on first paint.
   ============================================================================ */

// Must be set in the same module that uses <Document> / <Page>. `new URL(...,
// import.meta.url)` is the bundler-resolved form — Turbopack rewrites it to the
// emitted worker asset, so no next.config entry and no public/ copy (which the
// App Hosting deploy would not serve anyway — see docs/MEDIA-PIPELINE.md).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// The paper. No shadow — it runs flush to the sheet's edges, so there is no edge
// for a shadow to describe.
//
// DARK MODE inverts the page so it reads light-on-dark with the rest of the
// site instead of glaring white. `invert` flips lightness and `hue-rotate(180)`
// puts hues back where they were, so the result is a dark page with light text
// rather than a colour-negative of it. react-pdf writes `background-color: white`
// INLINE on .react-pdf__Page, which a class cannot beat — hence the `!` on the
// dark background. The filter is scoped to the canvas: the text and annotation
// layers sit above it and are transparent, so inverting them would do nothing
// useful and would flip the selection highlight.
const PAPER = "bg-white dark:!bg-[#0d1117]";
const PAPER_INK = "dark:[&_canvas]:invert dark:[&_canvas]:hue-rotate-180";

// Holds the sheet's scroll height steady before the page paints, at the exact
// US Letter aspect (612x792) so nothing jumps when it lands.
function Placeholder({ label }: { label?: string }) {
  return (
    <div
      className={`flex aspect-[612/792] w-full items-center justify-center ${PAPER}`}
    >
      {label ? <span className="text-note text-fg-subtle">{label}</span> : null}
    </div>
  );
}

export default function ResumeDocument() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // <Page> needs a pixel width. Measured from the column so the page always
  // fills it exactly, and re-measured on resize / breakpoint change (react-pdf
  // cancels and re-runs the render for us).
  const [width, setWidth] = useState(0);

  // Measured in a CALLBACK REF, not an effect, so the width is known the moment
  // the node attaches. ResizeObserver delivery is tied to the browser's
  // rendering steps, which a backgrounded tab never gets — waiting on its first
  // callback would leave the page unrendered until the tab is looked at. (Also
  // the same shape as LoveLetter's `ref={setScrollerEl}`: state from a ref
  // callback runs during commit, so it is not a setState-in-effect.)
  const attach = useCallback((node: HTMLDivElement | null) => {
    wrapRef.current = node;
    if (node) setWidth(node.clientWidth);
  }, []);

  // The observer then only has to handle LATER changes (window resize, the
  // 640px sheet breakpoint).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={attach} className="w-full">
      <Document
        file={RESUME_SRC}
        loading={<Placeholder />}
        error={<Placeholder label="The resume could not be displayed." />}
        // react-pdf sets inline pixel width/height on the canvas; this keeps it
        // fluid so a resize mid-render can never overflow the column.
        className={`[&_canvas]:!h-auto [&_canvas]:!w-full ${PAPER_INK}`}
      >
        {width > 0 ? (
          <Page
            pageNumber={1}
            width={width}
            renderTextLayer
            renderAnnotationLayer
            loading={<Placeholder />}
            className={PAPER}
          />
        ) : (
          <Placeholder />
        )}
      </Document>
    </div>
  );
}
