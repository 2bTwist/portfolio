"use client";

import { useEffect, useRef, useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  const copied = status === "copied";
  const message = copied ? "Copied" : status === "error" ? "Unable to copy. Select the code to copy it manually." : "";

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    if (pending.current) return;
    pending.current = true;
    if (timer.current) clearTimeout(timer.current);
    setStatus("idle");
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    } finally {
      pending.current = false;
    }
  }

  return (
    <>
    <button type="button" onClick={copy} className="code-copy" aria-label={copied ? "Copied" : status === "error" ? "Copy failed. Try copying code again" : "Copy code"} title={message || "Copy code"}>
      {/* Inline icons (lucide-derived) so this doesn't pull lucide-react in. */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </>
        )}
      </svg>
    </button>
    <span className={status === "error" ? "code-copy-feedback" : "sr-only"} role="status" aria-live="polite">{message}</span>
    </>
  );
}
