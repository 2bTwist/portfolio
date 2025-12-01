import Image from "next/image";
import { CodeBlock } from "./CodeBlock";
import { Callout } from "./Callout";
import { Mark } from "./Mark";

export const MDXComponents = {
  pre: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => (
    <Image alt={props.alt ?? ""} width={900} height={600} {...props} />
  ),
  Callout,
  Mark,
};
