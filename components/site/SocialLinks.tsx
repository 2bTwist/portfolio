import { profile } from "@/data/profile";

/* Social buttons for the hero. Brand marks are inlined SVG (not a Phosphor brand
   pack — those cost a few KB each in the always-loaded bundle). Server component:
   just links, no client JS. Links with "#" are hidden until a real URL is set. */

type Social = { label: string; href: string; path: string };

const SOCIALS: Social[] = [
  {
    label: "GitHub",
    href: profile.links.github,
    path: "M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z",
  },
  {
    label: "LinkedIn",
    href: profile.links.linkedin,
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  },
];

export function SocialLinks({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const links = SOCIALS.filter((s) => s.href && s.href !== "#");
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {links.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noreferrer noopener"
          className="ide-social"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={s.path} />
          </svg>
          <span>{s.label}</span>
        </a>
      ))}
      {/* Optional trailing slot — e.g. the hero's "more about me" link, so it
          sits in the same row as the social buttons. */}
      {children}
    </div>
  );
}
