import Image from "next/image";
import Link from "next/link";
import slugify from "slugify";
import Callout from "@/components/mdx/Callout";
import { ComponentProps } from "react";

export const MDXComponents = {
  // Heading anchors for h2
  h2: ({ children, ...props }: ComponentProps<"h2">) => {
    const slug = slugify(String(children), { lower: true, strict: true });
    return (
      <h2 id={slug} className="group scroll-mt-20" {...props}>
        <a
          href={`#${slug}`}
          className="opacity-0 group-hover:opacity-100 transition text-accent mr-2"
        >
          #
        </a>
        {children}
      </h2>
    );
  },

  // Heading anchors for h3
  h3: ({ children, ...props }: ComponentProps<"h3">) => {
    const slug = slugify(String(children), { lower: true, strict: true });
    return (
      <h3 id={slug} className="group scroll-mt-20" {...props}>
        <a
          href={`#${slug}`}
          className="opacity-0 group-hover:opacity-100 transition text-accent mr-2"
        >
          #
        </a>
        {children}
      </h3>
    );
  },

  // Remap <a> tags
  a: (props: ComponentProps<typeof Link>) => (
    <Link
      {...props}
      className="text-accent underline-offset-2 hover:underline"
    />
  ),

  // Remap <img> with centered layout
  img: (props: ComponentProps<typeof Image>) => (
    <div className="flex justify-center">
      <Image
        {...props}
        alt={props.alt || ""}
        className="rounded-lg my-6 shadow-subtle"
        width={props.width || 900}
        height={props.height || 600}
      />
    </div>
  ),

  // Custom callouts
  Callout,
};
