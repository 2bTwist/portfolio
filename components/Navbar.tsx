"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="w-40 pr-10 text-sm flex flex-col items-end gap-4 fixed right-0 top-10">
      <Link href="/" className="hover:opacity-70">
        Home
      </Link>
      <Link href="/about" className="hover:opacity-70">
        About
      </Link>
      <Link href="/blog" className="hover:opacity-70">
        Blog
      </Link>
      <Link href="/projects" className="hover:opacity-70">
        Projects
      </Link>

      <button
        className="mt-4"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {mounted ? (
          theme === "dark" ? <Sun size={18} /> : <Moon size={18} />
        ) : (
          <div className="w-[18px] h-[18px]" />
        )}
      </button>
    </nav>
  );
}
