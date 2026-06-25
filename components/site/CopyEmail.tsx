"use client";

import { useRef, useState } from "react";

/* Inline email that copies to the clipboard on click and pops a brief
   "Copied to clipboard" confirmation above it. Client component (needs the
   clipboard API + transient state); everything around it stays server-rendered. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // clipboard blocked (insecure context / permissions) — still flash feedback
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <span className="copy-email-wrap">
      <button type="button" className="txt-link copy-email" onClick={copy}>
        {email}
      </button>
      <span className={`copy-pop${copied ? " is-on" : ""}`} role="status" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </span>
  );
}
