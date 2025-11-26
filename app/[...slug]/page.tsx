import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params;
  const slug = slugArray?.join("/") || "index";
  const filePath = path.join(process.cwd(), "content", slug + ".mdx");

  if (!fs.existsSync(filePath)) return notFound();

  const source = fs.readFileSync(filePath, "utf-8");

  return (
    <article className="prose-custom content-wrapper">
      <MDXRemote source={source} />
    </article>
  );
}
