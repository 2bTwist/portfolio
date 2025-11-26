"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/blog/scalable-apis", label: "Blog" },
  { href: "/projects/peerpush", label: "Projects" },
  { href: "/about/page", label: "About" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <nav className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-accent-strong"
                    : "text-text-subtle hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded hover:bg-surface-hover transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun size={18} className="text-text-subtle" />
          ) : (
            <Moon size={18} className="text-text-subtle" />
          )}
        </button>
      </div>
    </nav>
  );
}
