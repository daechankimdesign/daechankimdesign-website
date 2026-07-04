# About profile fly-in stack

Drop image files here and they become the cards that fly in and stack over the
About-page portrait as you scroll.

- **Supported:** `.jpg` `.jpeg` `.png` `.webp` `.avif` `.gif`
- **Order = filename order.** They fly in alphabetically, so prefix with numbers
  to control the sequence: `01-studio.jpg`, `02-sketch.png`, `03-model.webp`, ...
- **Shape:** roughly square reads best (they `object-cover` into the portrait's
  frame), but any aspect works. ~1000x1000 or larger keeps them crisp.
- **How many:** 3–6 is the sweet spot. More still works; each just gets a thinner
  slice of the scroll to fly in.

No code changes needed — the page scans this folder on load. While it's empty,
the page falls back to the placeholder cards listed in
`src/content/en/about.mdx` (the `gallery:` frontmatter).

This `README.md` is ignored by the scanner; leave it or delete it, either is fine.
