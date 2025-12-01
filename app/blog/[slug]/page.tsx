import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";

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
  });

  return (
    <article className="max-w-4xl mx-auto">
      <h1
        className="text-5xl mb-4 text-center"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        {data.title as string}
      </h1>

      <p className="text-zinc-500 text-sm mb-10 text-center">{data.date as string}</p>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {MDXContent}
      </div>
    </article>
  );
}
