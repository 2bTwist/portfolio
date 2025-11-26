"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={cn(
        "h-full border-r border-border bg-surface shadow-subtle",
        "transition-all duration-300 overflow-hidden",
        open ? "w-64" : "w-14"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border bg-surface">
        <button
          className="p-2 rounded-md hover:bg-surface-hover transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {open && <span className="text-sm font-medium text-text-subtle">Navigation</span>}
      </div>

      {/* Tree Area */}
      <div className="overflow-y-auto h-[calc(100%-48px)] px-2 py-3">
        {children}
      </div>
    </aside>
  );
}
