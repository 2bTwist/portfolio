import { Highlight, themes, type PrismTheme } from "prism-react-renderer";
import { CopyButton } from "./CopyButton";

// oneLight is tuned for a near-white background; several of its token colors
// fall below WCAG AA (4.5:1) on our cream --bg (#f3ecdd) and tripped the a11y
// invariant. We deepen ONLY the failing hues (same H/S, lower L) to just clear
// 4.5:1 — derived from oneLight so it tracks upstream. Verified ratios in
// comments; recompute if --bg changes.
const CONTRAST_FIXES: Record<string, string> = {
  "hsl(230, 4%, 64%)": "hsl(230, 4%, 42.5%)", // comment        2.19 -> 4.64
  "hsl(35, 99%, 36%)": "hsl(35, 99%, 30.5%)", // class-name/num 3.49 -> 4.59
  "hsl(5, 74%, 59%)": "hsl(5, 74%, 45.5%)", //   tag/property    3.12 -> 4.59
  "hsl(119, 34%, 47%)": "hsl(119, 34%, 34.5%)", // string/builtin 2.72 -> 4.65
  "hsl(221, 87%, 60%)": "hsl(221, 87%, 52%)", // function/var    3.44 -> 4.59
  "hsl(198, 99%, 37%)": "hsl(198, 99%, 31.5%)", // url           3.55 -> 4.67
};
const creamOneLight: PrismTheme = {
  ...themes.oneLight,
  styles: themes.oneLight.styles.map((s) =>
    s.style.color && CONTRAST_FIXES[s.style.color]
      ? { ...s, style: { ...s.style, color: CONTRAST_FIXES[s.style.color] } }
      : s,
  ),
};

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
      <Highlight code={code} language={language} theme={creamOneLight}>
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
