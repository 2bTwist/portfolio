import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";

export default function Home() {
  const filePath = path.join(process.cwd(), "content", "index.mdx");
  const source = fs.readFileSync(filePath, "utf-8");

  return (
    <div className="max-w-content mx-auto px-6 py-12">
      <article className="prose prose-lg max-w-none">
        <MDXRemote source={source} />
      </article>
    </div>
  );
}
