import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "success" | "link";

/* Inline icons (lucide-derived paths) so blog posts don't pull lucide-react
   into the bundle. 24x24 viewBox, currentColor stroke. */
const ICONS: Record<CalloutType, ReactNode> = {
  note: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  tip: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5a6 6 0 1 0-9 0C8.3 12.3 8.8 13 9 14" />
      <path d="M9 18h6M10 22h4" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  success: (
    <>
      <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
      <path d="m9 11 3 3L22 4" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>
  ),
};

export function Callout({ type = "note", children }: { type?: CalloutType; children: ReactNode }) {
  return (
    <div className={`callout callout--${type}`}>
      <svg
        className="callout-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[type]}
      </svg>
      <div className="callout-body">{children}</div>
    </div>
  );
}
