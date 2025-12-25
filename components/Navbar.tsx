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
    <nav className="fixed top-0 left-0 right-0 px-4 py-3 flex flex-row items-center justify-center gap-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 lg:border-0 lg:bg-transparent lg:w-40 lg:pr-10 lg:py-0 lg:flex-col lg:items-end lg:gap-4 lg:right-0 lg:top-10 lg:left-auto text-sm z-50">
      <Link href="/" className="hover:opacity-70">
        Home
      </Link>
      <Link href="/#projects" className="hover:opacity-70">
        Projects
      </Link>
      <Link href="/blog" className="hover:opacity-70">
        Blog
      </Link>

      <div className="flex flex-row items-center gap-4 lg:flex-col lg:items-end lg:mt-4">
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
