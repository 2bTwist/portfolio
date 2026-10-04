"use client";

/* Split-pane body for MDX pages (blog posts + project stories). The server-only
   MDX can't render in a client registry, so this fetches the route's serialized
   MDX and header data from /api/pane and renders the same document the route
   does: the shared header (with a plain banner; the route's image owns the
   morph) and the body with the real MDX components, its heading ids prefixed.
   It reads which file to show from the split store; the registry passes only
   the pane's label. */

import { useEffect, useState } from "react";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote";
import { MDXComponents, headingComponents } from "@/components/mdx/MDXComponents";
import { PageShell, type PaneProps } from "@/components/site/PageShell";
import { PostHeader, ProjectHeader } from "@/components/content/ArticleHeaders";
import { getProject } from "@/data/projects";
import type { PaneDocument } from "@/app/api/pane/route";
import { useSplit } from "./splitStore";
import { SPLIT_ID_PREFIX } from "./splitPane";

const PANE_MDX = { ...MDXComponents, ...headingComponents(SPLIT_ID_PREFIX) };

function paneBanner(alt: string) {
  return function PaneBanner(src: string) {
    return <Image src={src} alt={alt} fill sizes="(min-width: 768px) 50vw, 100vw" />;
  };
}

function Document({ doc }: { doc: PaneDocument }) {
  if (doc.kind === "post") {
    return (
      <>
        <PostHeader post={doc.post} banner={paneBanner(doc.post.title)} />
        <div className="prose-content mt-10">
          <MDXRemote {...doc.mdx} components={PANE_MDX} />
        </div>
      </>
    );
  }
  const project = getProject(doc.id);
  if (!project) return <p style={{ color: "var(--muted)" }}>Could not load this file in a split pane.</p>;
  return (
    <>
      <ProjectHeader project={project} banner={paneBanner(project.title)} />
      {doc.mdx ? (
        <div className="prose-content mt-10">
          <MDXRemote {...doc.mdx} components={PANE_MDX} />
        </div>
      ) : (
        <p className="mt-8 text-lg leading-relaxed" style={{ color: "var(--text)" }}>
          {project.detail}
        </p>
      )}
    </>
  );
}

export function MdxPaneBody({ paneLabel }: Required<PaneProps>) {
  const { rightHref } = useSplit();
  const [doc, setDoc] = useState<PaneDocument | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!rightHref) return;
    // SplitView keys this pane by rightHref, so it remounts (status starts at
    // "loading") whenever the file changes. Closing the pane aborts the request.
    const request = new AbortController();
    fetch(`/api/pane?href=${encodeURIComponent(rightHref)}`, { signal: request.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: PaneDocument) => {
        setDoc(d);
        setStatus("ready");
      })
      .catch(() => {
        if (!request.signal.aborted) setStatus("error");
      });
    return () => request.abort();
  }, [rightHref]);

  return (
    <PageShell paneLabel={paneLabel}>
      {status === "loading" ? (
        <p className="ide-split-loading">Loading&hellip;</p>
      ) : status === "error" || !doc ? (
        <p style={{ color: "var(--muted)" }}>Could not load this file in a split pane.</p>
      ) : (
        <Document doc={doc} />
      )}
    </PageShell>
  );
}
