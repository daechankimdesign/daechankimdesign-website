// Shared external destinations, so the same link can't drift between the places
// that render it (the top bar and the hero CTA previously disagreed).
//
// The resume is hosted on Firebase Storage (media/about/), NOT in public/: the
// App Hosting deploy serves no public/ paths, so a local "/resume.pdf" 404s.
// See docs/MEDIA-PIPELINE.md. Verify with:
//   curl -s -o /dev/null -w "%{http_code}\n" "<url>"   # must be 200
export const RESUME_URL =
  "https://firebasestorage.googleapis.com/v0/b/daechankimdesign-2026.firebasestorage.app/o/media%2Fabout%2Fresume.pdf?alt=media";
