/* Presentational primitives shared by the content routes. Server components
   (no "use client") so every route stays SSR'd and crawlable. They read the
   palette CSS vars set at :root. */

import type { ReactNode } from "react";
import Link from "next/link";
import { TagIcon } from "./tagIcons";

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

/* Tactile tag pill — same press-layer language as the project-card tags
   (gradient face + inset highlight + drop shadow), with the brand glyph when
   one exists. Kept consistent everywhere tags appear. */
export function Tag({ children }: { children: ReactNode }) {
  const label = typeof children === "string" ? children : "";
  return (
    <span className="proj-tag mono">
      {label ? <TagIcon name={label} /> : null}
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
  icon,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: ReactNode;
}) {
  const className = "btn no-underline" + (variant === "ghost" ? " btn--ghost" : "");
  const inner = (
    <>
      <span className="btn__shadow" aria-hidden="true" />
      <span className="btn__edge" aria-hidden="true" />
      <span className="btn__front">
        {icon}
        {children}
      </span>
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
    <Link href={href} prefetch={false} className={className}>
      {inner}
    </Link>
  );
}
