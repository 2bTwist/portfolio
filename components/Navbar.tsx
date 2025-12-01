"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, RssIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <nav className="w-40 pr-10 text-sm flex flex-col items-end gap-4 fixed right-0 top-10">
      <Link href="/" className="hover:opacity-70">
        Home
      </Link>
      <Link href="/#projects" className="hover:opacity-70">
        Projects
      </Link>
      <Link href="/blog" className="hover:opacity-70">
        Blog
      </Link>

      <div className="flex flex-col items-end gap-4 mt-4">
        <Link
          href="/rss.xml"
          className="hover:opacity-70"
          aria-label="RSS Feed"
          target="_blank"
          rel="noopener noreferrer"
        >
          <RssIcon size={18} />
        </Link>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "dark" ? <Sun size={18} /> : <Moon size={18} />
          ) : (
            <div className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </nav>
  );
}
