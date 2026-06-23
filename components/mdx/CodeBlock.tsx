import { Highlight, themes } from "prism-react-renderer";
import { CopyButton } from "./CopyButton";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function CodeBlock(props: any) {
  // children = <code class="language-ts">content</code>
  const code = props.children?.props?.children?.trim() ?? "";
  const className: string = props.children?.props?.className || "";
  const language = className.replace("language-", "") || "typescript";
  const title: string | undefined = props.children?.props?.title;

  return (
    <div className="code-block">
      {title ? <div className="code-title mono">{title}</div> : null}
      <CopyButton text={code} />
      <Highlight code={code} language={language} theme={themes.oneLight}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="code-pre">
            {tokens.map((line, i) => (
              // Index key is safe: lines are highlighted server-side once and
              // never reordered. Our className wins (spread first, override after).
              <div key={i} {...getLineProps({ line })} className="code-line">
                <span className="code-ln" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="code-content">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
