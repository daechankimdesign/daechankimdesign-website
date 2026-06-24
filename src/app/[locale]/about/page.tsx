import { setRequestLocale } from "next-intl/server";
import { getCompiledPage } from "@/lib/mdx";
import { DisplayHeading } from "@/components/DisplayHeading";
import { ProgressiveImage } from "@/components/ProgressiveImage";
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
      <main className="container-page py-24">
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

  return (
    <main className="container-page py-24">
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        {/* Far left: scroll-spy side tab (desktop only) */}
        <aside className="hidden lg:block lg:order-first lg:w-48 lg:shrink-0">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <SideDocumentTab />
          </div>
        </aside>

        {/* Middle: profile image (sticky on desktop), between tab and content */}
        <aside className="lg:w-56 lg:shrink-0">
          {portrait ? (
            <div className="mx-auto max-w-xs lg:mx-0 lg:max-w-none lg:sticky lg:top-24">
              <ProgressiveImage
                src={portrait}
                alt={frontmatter.title}
                width={1447}
                height={1446}
                sizes="(max-width: 1024px) 20rem, 14rem"
                className="rounded-md"
              />
            </div>
          ) : null}
        </aside>

        {/* Right: page content */}
        <div className="min-w-0 flex-1">
          <header className="mb-8">
            <DisplayHeading>{frontmatter.title}</DisplayHeading>
            {frontmatter.summary ? (
              <p className="text-body mt-3 text-fg-muted">
                {frontmatter.summary}
              </p>
            ) : null}
          </header>
          <article className="max-w-[70ch]">{content}</article>
        </div>
      </div>
    </main>
  );
}
