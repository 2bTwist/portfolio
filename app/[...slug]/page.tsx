import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import matter from "gray-matter";
import { MDXComponents } from "@/components/mdx/MDXComponents";

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params;
  const slug = slugArray?.join("/") || "index";
  const filePath = path.join(process.cwd(), "content", slug + ".mdx");

  if (!fs.existsSync(filePath)) return notFound();

  const file = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(file);

  const { title, date } = data;

  return (
    <article className="prose-custom">
      <header className="mb-10">
        <h1 className="text-4xl font-display font-semibold mb-2">{title}</h1>
        <p className="text-text-subtle text-sm">
          {new Date(date).toLocaleDateString()} • {Math.ceil(content.split(" ").length / 200)} min read
        </p>
      </header>

      <MDXRemote source={content} components={MDXComponents} />
    </article>
  );
}
