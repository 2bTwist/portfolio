import Image from "next/image";
import { CodeBlock } from "./CodeBlock";
import { Callout } from "./Callout";
import { Mark } from "./Mark";
import { TryTheSite } from "./TryTheSite";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* Flatten heading children to plain text, then slugify for a stable anchor id.
   Used so the side TOC (and shareable #section links) have targets. */
function textOf(node: any): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && node.props) return textOf(node.props.children);
  return "";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/* `idPrefix` keeps a second rendering of the same article (a split pane) from
   repeating the route's heading ids. */
export function headingComponents(idPrefix = "") {
  return {
    h2: ({ children, ...props }: any) => (
      <h2 id={idPrefix + slugify(textOf(children))} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 id={idPrefix + slugify(textOf(children))} {...props}>
        {children}
      </h3>
    ),
  };
}

export const MDXComponents = {
  pre: (props: any) => <CodeBlock {...props} />,
  ...headingComponents(),
  img: (props: any) => (
    <Image
      alt={props.alt ?? ""}
      width={900}
      height={600}
      className="w-full h-auto max-w-full rounded-lg"
      sizes="(max-width: 768px) 100vw, 720px"
      {...props}
    />
  ),
  Callout,
  Mark,
  TryTheSite,
};
