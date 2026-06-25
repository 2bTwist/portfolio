import type { ReactNode } from "react";

/* An inline word that reveals a little popover (e.g. a flag) on hover. Reuses the
   CompanyLink popover styling. Pure CSS hover, so it stays a server component.
   Decorative reveal only — the word itself carries the meaning in text. */
export function HoverWord({
  children,
  pop,
}: {
  children: ReactNode;
  pop: ReactNode;
}) {
  return (
    <span className="company-link hover-word">
      {children}
      <span className="company-pop" aria-hidden="true">
        {pop}
      </span>
    </span>
  );
}
