import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "404 - Not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-8">
        <p className="mono text-sm" style={{ color: "var(--accent)" }}>
          404
        </p>
        <h1 className="display text-4xl sm:text-5xl font-bold mt-2" style={{ color: "var(--text)" }}>
          This file isn&apos;t in the tree.
        </h1>
        <p className="mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>
          You followed a path that doesn&apos;t exist. Even{" "}
          <code className="mono" style={{ color: "var(--text)" }}>
            cat /dev/null
          </code>{" "}
          would have returned more.
        </p>
        <p className="mono mt-7" style={{ color: "var(--muted)" }}>
          <span style={{ color: "var(--accent)" }}>~/edmond</span> $ cd{" "}
          <Link href="/" className="underline" style={{ color: "var(--accent)" }}>
            ~
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
