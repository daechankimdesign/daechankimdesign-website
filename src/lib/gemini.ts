import { GoogleGenAI } from "@google/genai";
import { localeNames, type Locale } from "@/i18n/routing";

// Pinned (not a floating alias) for reproducible output. Flash gives near-Pro
// translation quality at a fraction of the cost — right for a low-traffic site
// that caches each page permanently after one translation.
const MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are a professional localizer for a product designer's portfolio. You translate MDX documents (Markdown + JSX).

Translate ONLY:
- natural-language prose, and
- the VALUES of the frontmatter keys "title" and "summary".

NEVER translate or alter:
- frontmatter keys themselves, or the values of "slug", "thumbnail", "date", "tags";
- URLs, file paths, email addresses;
- code inside fenced code blocks or inline backticks;
- JSX/HTML tag names, attribute/prop names, attribute/prop values, and {expressions}.

Preserve the document structure exactly: the same --- frontmatter fence, the same headings, the same components with the same props, the same Markdown syntax. Keep proper nouns and brand names as-is unless a well-established localized form exists.

Output ONLY the raw translated MDX document — no explanations and no surrounding code fences.`;

/** Translate a full MDX document into `locale`. Throws on empty/missing key. */
export async function translateMdx(
  source: string,
  locale: Locale,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const ai = new GoogleGenAI({ apiKey });
  const target = localeNames[locale];

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Translate the following MDX document into ${target} (locale "${locale}").\n\n${source}`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
  });

  const text = res.text;
  if (!text || !text.trim()) throw new Error("Gemini returned empty output");
  return stripCodeFences(text.trim());
}

/**
 * Models occasionally wrap output in a ```mdx fence despite instructions. Only
 * unwrap when the inner content is a real MDX document (starts with the `---`
 * frontmatter fence), so a document that legitimately opens with a code fence
 * isn't corrupted.
 */
function stripCodeFences(s: string): string {
  const m = s.match(/^```(?:mdx|markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
  return m && m[1].trimStart().startsWith("---") ? m[1] : s;
}
