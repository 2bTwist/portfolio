import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { MDXComponents } from "@/components/MDXComponents";
import { BlogStats } from "@/components/BlogStats";

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filePath = path.join(process.cwd(), "content/blog", `${slug}.mdx`);
  const source = fs.readFileSync(filePath, "utf8");

  const { content, data } = matter(source);

  const { content: MDXContent } = await compileMDX({
    source: content,
    options: { parseFrontmatter: false },
    components: MDXComponents,
  });

  return (
    <article className="max-w-4xl mx-auto">
      <h1
        className="text-5xl mb-4 text-center"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        {data.title as string}
      </h1>

      <div className="flex items-center justify-center gap-4 mb-10">
        <p className="text-zinc-500 text-sm">{data.date as string}</p>
        <span className="text-zinc-300 dark:text-zinc-700">•</span>
        <BlogStats slug={slug} />
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {MDXContent}
      </div>
    </article>
  );
}
