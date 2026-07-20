import { setRequestLocale } from "next-intl/server";
import { getCompiledPage } from "@/lib/mdx";
import { Reveal, RevealItem } from "@/components/Reveal";
import { ProfileStack } from "@/components/ProfileStack";
import { SideDocumentTab } from "@/components/SideDocumentTab";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getCompiledPage("about");

  if (!result || result.error) {
    return (
      <main className="container-page pt-16 pb-24 lg:pt-40">
        <h1 className="text-h1">About</h1>
        <p className="text-body text-fg-muted mt-4">
          About content is unavailable.
        </p>
      </main>
    );
  }

  const { content, frontmatter } = result;
  const portrait =
    typeof frontmatter.portrait === "string" ? frontmatter.portrait : null;
  // Fly-in gallery cards come from the frontmatter `gallery:` (Firebase URLs;
  // originals in media-src/about/stack/). A local public/ scan would 404 on the
  // App Hosting deploy, so it's intentionally gone.
  const stackImages = Array.isArray(frontmatter.gallery)
    ? (frontmatter.gallery.filter((s) => typeof s === "string") as string[])
    : [];

  return (
    <main className="container-page pt-16 pb-24 lg:pt-40">
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        {/* Far left: scroll-spy side tab (desktop only) */}
        <aside className="hidden lg:block lg:order-first lg:w-48 lg:shrink-0">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <SideDocumentTab maxLevel={2} />
          </div>
        </aside>

        {/* Middle: profile image (sticky on desktop), between tab and content */}
        <aside className="lg:w-56 lg:shrink-0">
          {portrait ? (
            <div className="mx-auto w-40 lg:mx-0 lg:w-auto lg:max-w-none lg:sticky lg:top-24">
              <ProfileStack
                portrait={portrait}
                alt={frontmatter.title}
                images={stackImages}
              />
            </div>
          ) : null}
        </aside>

        {/* Right: page content */}
        <div className="min-w-0 flex-1 content-column">
          <header className="mb-8">
            <Reveal>
              <RevealItem as="h1" className="text-display">
                {frontmatter.title}
              </RevealItem>
              {frontmatter.summary ? (
                <RevealItem
                  as="p"
                  className="text-body mt-3 text-fg-muted measure-lede"
                >
                  {frontmatter.summary}
                </RevealItem>
              ) : null}
            </Reveal>
          </header>
          <article className="about-doc measure">{content}</article>
        </div>
      </div>
    </main>
  );
}
