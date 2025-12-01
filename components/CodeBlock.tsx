"use client";

import React from "react";
import { Highlight, themes } from "prism-react-renderer";
import { CopyButton } from "./CopyButton";

export function CodeBlock(props: any) {
  // children = <code class="language-ts">content</code>
  const code = props.children?.props?.children?.trim() ?? "";
  const className = props.children?.props?.className || "";
  const language = className.replace("language-", "") || "typescript";
  const title = props.children?.props?.title;

  return (
    <div className="relative my-8 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 font-mono text-zinc-600 dark:text-zinc-400">
          {title}
        </div>
      )}

      <CopyButton text={code} />

      <Highlight code={code} language={language} theme={themes.github}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={style}
            className="p-4 text-sm overflow-x-auto bg-zinc-50 dark:bg-zinc-900 leading-relaxed"
          >
            {tokens.map((line, i) => (
              <div key={i} className="table-row" {...getLineProps({ line })}>
                <span className="table-cell pr-4 select-none text-zinc-400 text-right">
                  {i + 1}
                </span>
                <span className="table-cell">
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
