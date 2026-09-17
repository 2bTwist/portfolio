"use client";

import { useEffect, useRef, useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    if (pending.current) return;
    pending.current = true;
    if (timer.current) clearTimeout(timer.current);
    setMessage("");
    try {
      await navigator.clipboard.writeText(email);
      setMessage("Copied to clipboard");
      timer.current = setTimeout(() => setMessage(""), 1600);
    } catch {
      setMessage("Unable to copy. Select the email to copy it manually.");
    } finally {
      pending.current = false;
    }
  }

  return (
    <span className="copy-email-wrap">
      <button type="button" className="txt-link copy-email" onClick={copy}>
        {email}
      </button>
      <span className={`copy-pop${message ? " is-on" : ""}`} role="status" aria-live="polite">
        {message}
      </span>
    </span>
  );
}
