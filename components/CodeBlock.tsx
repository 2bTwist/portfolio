"use client";

import React from "react";
import { Highlight, themes } from "prism-react-renderer";

export function CodeBlock(props: any) {
  // children = <code class="language-ts">content</code>
  const code = props.children?.props?.children?.trim() ?? "";
  const className = props.children?.props?.className || "";
  const language = className.replace("language-", "") || "typescript";

  return (
    <Highlight
      code={code}
      language={language}
      theme={themes.github}
    >
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          style={style}
          className="rounded-lg p-4 overflow-x-auto border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm leading-relaxed my-6"
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
