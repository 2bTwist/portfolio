/* Presentational primitives shared by the content routes. Server components
   (no "use client") so every route stays SSR'd and crawlable. They read the
   palette CSS vars set at :root. */

import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  title,
  lead,
}: {
  title: string;
  lead?: ReactNode;
}) {
  return (
    <header className="mb-8">
      <h1 className="display text-4xl sm:text-5xl font-bold" style={{ color: "var(--text)" }}>
        {title}
      </h1>
      {lead ? (
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text)" }}>
          {lead}
        </p>
      ) : null}
    </header>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-4 leading-relaxed">{children}</div>;
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p className="leading-relaxed" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className="mono text-xs px-2 py-1 rounded-md"
      style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
    >
      {children}
    </span>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Tag key={t}>{t}</Tag>
      ))}
    </div>
  );
}

/* Tactile action rendered as a real anchor (works without JS, crawlable).
   The three-layer press button (shadow / edge / front) is pure CSS, so this
   stays a server component. The label lives in .btn__front; the shadow/edge
   layers are decorative (aria-hidden). External links get the right rel/target. */
export function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const className = "btn no-underline" + (variant === "ghost" ? " btn--ghost" : "");
  const inner = (
    <>
      <span className="btn__shadow" aria-hidden="true" />
      <span className="btn__edge" aria-hidden="true" />
      <span className="btn__front">{children}</span>
    </>
  );
  const external = href.startsWith("http");
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
