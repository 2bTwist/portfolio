import type { ReactNode } from "react";

/* An inline link to a company you worked at; hovering reveals the company logo in
   a little popover above it. Pure CSS hover, so it stays a server component. */
export function CompanyLink({
  name,
  href,
  logo,
}: {
  name: string;
  href: string;
  logo: ReactNode;
}) {
  return (
    <a className="company-link" href={href} target="_blank" rel="noreferrer noopener">
      {name}
      <span className="company-pop" aria-hidden="true">
        {logo}
      </span>
    </a>
  );
}
