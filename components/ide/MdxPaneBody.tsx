"use client";

/* Split-pane body for MDX pages (blog posts + project stories). The server-only
   MDX can't render in a client registry, so this fetches the route's serialized
   MDX from /api/pane and renders it with <MDXRemote> using the same components as
   the real page. It reads which file to show from the split store, so it needs no
   props from the registry. */

import { useEffect, useState } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXComponents } from "@/components/mdx/MDXComponents";
import { PageShell } from "@/components/site/PageShell";
import { useSplit } from "./splitStore";

type Loaded = { title?: string; mdx: MDXRemoteSerializeResult | null; fallback?: string };

export function MdxPaneBody() {
  const { rightHref } = useSplit();
  const [data, setData] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!rightHref) return;
    // EditorArea keys this pane by rightHref, so it remounts (status starts at
    // "loading") whenever the file changes.
    let cancelled = false;
    fetch(`/api/pane?href=${encodeURIComponent(rightHref)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Loaded) => {
        if (cancelled) return;
        setData(d);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [rightHref]);

  return (
    <PageShell>
      {status === "loading" ? (
        <p className="ide-split-loading">Loading&hellip;</p>
      ) : status === "error" ? (
        <p style={{ color: "var(--muted)" }}>Could not load this file in a split pane.</p>
      ) : (
        <>
          {data?.title ? (
            <h1 className="display text-3xl sm:text-4xl font-bold mt-4" style={{ color: "var(--text)" }}>
              {data.title}
            </h1>
          ) : null}
          <div className="prose-content mt-8">
            {data?.mdx ? (
              <MDXRemote {...data.mdx} components={MDXComponents} />
            ) : (
              <p style={{ color: "var(--muted)" }}>{data?.fallback}</p>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
