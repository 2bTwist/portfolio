"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={copy} className="code-copy" aria-label={copied ? "Copied" : "Copy code"}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}
