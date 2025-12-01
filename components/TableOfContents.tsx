"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      let current = "";
      headings.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el && window.scrollY >= el.offsetTop - 200) {
          current = h.id;
        }
      });
      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block fixed right-0 top-32 w-64 pr-10">
      <div className="text-sm space-y-2">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          On this page
        </h3>
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`block transition-colors ${
              h.level === 3 ? "pl-4" : ""
            } ${
              activeId === h.id
                ? "text-blue-500 dark:text-blue-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {h.text}
          </a>
        ))}
      </div>
    </aside>
  );
}
