import Image from "next/image";
import { CodeBlock } from "./CodeBlock";
import { Callout } from "./Callout";
import { Mark } from "./Mark";

export const MDXComponents = {
  pre: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => (
    <Image
      alt={props.alt ?? ""}
      width={900}
      height={600}
      className="w-full h-auto max-w-full"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
      {...props}
    />
  ),
  Callout,
  Mark,
};
