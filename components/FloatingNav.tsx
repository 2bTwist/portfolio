"use client";

import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Github,
  Linkedin,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function FloatingNav() {
  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(false);

  // Fade-in only after scrolling past hero (~120px)
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed right-6 top-1/2 -translate-y-1/2 z-40",
        "flex flex-col gap-3",
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* THEME TOGGLE */}
      <IconButton
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </IconButton>

      {/* GITHUB */}
      <IconButton
        as="a"
        href="https://github.com/2btwist"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Github size={17} />
      </IconButton>

      {/* LINKEDIN */}
      <IconButton
        as="a"
        href="https://www.linkedin.com/in/edmond-batch/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Linkedin size={17} />
      </IconButton>

      {/* SCROLL UP */}
      <IconButton onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <ArrowUp size={17} />
      </IconButton>

      {/* SCROLL DOWN */}
      <IconButton
        onClick={() =>
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
        }
      >
        <ArrowDown size={17} />
      </IconButton>
    </div>
  );
}

/* —————— Small reusable stupid-clean Icon Button component —————— */
function IconButton({
  children,
  onClick,
  as,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "a";
  [key: string]: unknown;
}) {
  const Comp = as || "button";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-11 h-11 flex items-center justify-center",
        "rounded-lg shadow-card bg-surface",
        "border border-border-subtle",
        "hover:bg-surface-hover transition-colors",
        "cursor-pointer"
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
