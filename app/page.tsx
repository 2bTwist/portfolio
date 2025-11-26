import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";

export default function Home() {
  const filePath = path.join(process.cwd(), "content", "index.mdx");
  const source = fs.readFileSync(filePath, "utf-8");

  return (
    <article className="prose-custom content-wrapper">
      <MDXRemote source={source} />
    </article>
  );
}
