import sharp from "sharp";
import { readdir } from "node:fs/promises";

const D = "media-src/projects/translate-furniture-as-a-service-to-tackle-social-phenomenon";
const OUT = process.argv[2];

// Everything the plan needs to show inline. New webp (7) + the old affinity map
// (for the replace comparison) + a couple existing PNGs for section context.
const files = [
  // new
  "lyFT7HHGUSvlEDx8PRy6MMaedVc.webp",
  "qs9XiX9w5rLsUDEdzytD106B5pI.webp",
  "utbqengsJKqyH4jNkdBdXaACPY.webp",
  "xh89aKnVW88siIY4CCg5yoPOX0.webp",
  "sHmDi3EHWJByMpm3NtuWm7lBJ20.webp",
  "PlxOHmmPkejS2i1iwoZTGoO7P8Q.webp",
  "3ncEJWSVTFm6d26GCrlwI1LXkM.webp",
  // existing, for context / comparison
  "04-research-affinity-map.png",
  "01-outcome-subscription.png",
  "02-research-floorplan-stimulus.png",
  "03-research-day-in-life.png",
];

const out = {};
for (const f of files) {
  const buf = await sharp(`${D}/${f}`)
    .resize(720, 720, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 68 })
    .toBuffer();
  out[f] = `data:image/webp;base64,${buf.toString("base64")}`;
  process.stderr.write(`  ${f}: ${(buf.length/1024).toFixed(0)}KB\n`);
}
process.stdout.write(JSON.stringify(out));
