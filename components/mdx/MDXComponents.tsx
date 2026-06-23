import Image from "next/image";
import { CodeBlock } from "./CodeBlock";
import { Callout } from "./Callout";
import { Mark } from "./Mark";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const MDXComponents = {
  pre: (props: any) => <CodeBlock {...props} />,
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
};
