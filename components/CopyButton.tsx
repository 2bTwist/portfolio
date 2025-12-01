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
    <button
      onClick={copy}
      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200 transition"
      aria-label="Copy code"
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
    </button>
  );
}
