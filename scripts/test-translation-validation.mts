// Standalone sanity test for the pure frontmatter-preservation check.
// Run: node --experimental-strip-types scripts/test-translation-validation.mts
import assert from "node:assert/strict";
import {
  checkPreservedFrontmatter,
  checkComponentTags,
} from "../src/lib/mdx-validate.ts";

const SOURCE = `---
title: "Single-Mold Stool"
summary: "A stackable stool from a single mold."
thumbnail: "https://picsum.photos/seed/x/1600/900"
date: "2024-11-01"
tags: ["Industrial Design", "Product Design"]
---

The Single-Mold Stool asks a simple question.

<VideoPlayer type="embed" src="https://youtube.com/embed/x" />
`;

let passed = 0;
const ok = (name: string) => {
  console.log(`  ok - ${name}`);
  passed++;
};

// 1) A clean translation (title/summary translated, preserved keys identical).
{
  const good = SOURCE.replace('"Single-Mold Stool"', '"단일 몰드 스툴"').replace(
    '"A stackable stool from a single mold."',
    '"하나의 몰드로 만든 적층형 스툴."',
  );
  const res = checkPreservedFrontmatter(SOURCE, good);
  assert.equal(res.ok, true, "clean translation should pass");
  ok("clean translation passes");
}

// 2) A translation that mutated a PRESERVED key (date) must fail.
{
  const bad = SOURCE.replace('"2024-11-01"', '"2024년 11월 1일"');
  const res = checkPreservedFrontmatter(SOURCE, bad);
  assert.equal(res.ok, false, "altered date must fail");
  assert.match((res as { reason: string }).reason, /date/);
  ok("altered preserved key (date) fails");
}

// 3) A translation that mutated tags must fail.
{
  const bad = SOURCE.replace('"Industrial Design"', '"산업 디자인"');
  const res = checkPreservedFrontmatter(SOURCE, bad);
  assert.equal(res.ok, false, "altered tags must fail");
  assert.match((res as { reason: string }).reason, /tags/);
  ok("altered preserved key (tags) fails");
}

// 4) A translation that dropped the title must fail.
{
  const bad = SOURCE.replace('title: "Single-Mold Stool"', 'title: ""');
  const res = checkPreservedFrontmatter(SOURCE, bad);
  assert.equal(res.ok, false, "empty title must fail");
  assert.match((res as { reason: string }).reason, /title/);
  ok("empty translated key (title) fails");
}

// 5) Component tags preserved when only prose/values are translated.
{
  const good = SOURCE.replace('"Single-Mold Stool"', '"단일 몰드 스툴"');
  const res = checkComponentTags(SOURCE, good);
  assert.equal(res.ok, true, "preserved component tags should pass");
  ok("component tags preserved passes");
}

// 6) A renamed/localized component tag (<VideoPlayer> -> <비디오플레이어>) must fail.
{
  const bad = SOURCE.replace("<VideoPlayer", "<비디오플레이어");
  const res = checkComponentTags(SOURCE, bad);
  assert.equal(res.ok, false, "renamed component must fail");
  ok("renamed component tag fails");
}

// 7) An invented/hallucinated component must fail.
{
  const bad = SOURCE.replace(
    "The Single-Mold Stool asks a simple question.",
    "<HallucinatedWidget /> The Single-Mold Stool asks a simple question.",
  );
  const res = checkComponentTags(SOURCE, bad);
  assert.equal(res.ok, false, "invented component must fail");
  ok("invented component tag fails");
}

console.log(`\n${passed}/7 checks passed`);
