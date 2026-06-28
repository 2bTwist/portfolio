"use client";

import { useEffect, useRef, useState } from "react";

/* Side table-of-contents with scroll-spy for long articles (project stories and
   blog posts). Reads the rendered `.prose-content` headings on mount — their
   ids are assigned server-side by the MDX heading components — builds the list,
   and tracks the section in view with an IntersectionObserver. Click jumps to a
   section (smooth unless the reader prefers reduced motion).

   It renders nothing for short articles (< 2 headings) and is hidden by JS when
   the left gap is too tight. The terminal panel sits above it (z-index) so the
   rail's lower part is covered, not hidden, when the terminal opens. Pure DOM
   reads + one observer. */

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function ArticleToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  // Horizontal anchor + visibility are computed from the live layout, not a CSS
  // media query: the IDE shell's left sidebar offsets the centered reading
  // column, so the usable margins can't be assumed. We park the rail in the
  // LEFT gap (between the shell sidebar and the column) and hide it when that
  // gap is too tight. `<main>`'s left edge is the sidebar's right edge.
  const [pos, setPos] = useState<{ left: number; show: boolean }>({ left: 0, show: false });
  // While a click-jump is animating, ignore observer-driven active changes so
  // the marker goes straight to the clicked section instead of flickering
  // through every section the smooth scroll passes (worse for tall, multi-line
  // entries, which take longer to scroll past).
  const lockRef = useRef(false);
  const unlockTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const TOC_WIDTH = 168;
    const GAP = 24;
    const place = () => {
      const col = document.querySelector<HTMLElement>(".prose-content");
      if (!col) return;
      const colLeft = col.getBoundingClientRect().left;
      const mainLeft = document.querySelector("main")?.getBoundingClientRect().left ?? 0;
      const gap = colLeft - mainLeft; // usable left margin inside the shell
      // Center the rail in that gap; show only when it comfortably fits.
      const left = mainLeft + Math.max(GAP, (gap - TOC_WIDTH) / 2);
      setPos({ left, show: gap >= TOC_WIDTH + GAP * 1.5 });
    };
    place();
    window.addEventListener("resize", place, { passive: true });

    let observer: IntersectionObserver | undefined;
    // Defer the DOM read out of the effect body (a frame in), so layout is
    // settled and we are not setting state synchronously during the effect.
    const frame = requestAnimationFrame(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(".prose-content h2, .prose-content h3"),
      ).filter((el) => el.id);
      if (nodes.length === 0) return;

      setHeadings(
        nodes.map((el) => ({
          id: el.id,
          text: el.textContent ?? "",
          level: el.tagName === "H3" ? 3 : 2,
        })),
      );

      // A heading is "active" once it crosses into the top third of the
      // viewport. Track which ones are in the band, then highlight the first
      // (in document order), so reading down the page advances the marker.
      const seen = new Set<string>();
      observer = new IntersectionObserver(
        (entries) => {
          if (lockRef.current) return; // a click-jump owns the active state
          for (const entry of entries) {
            if (entry.isIntersecting) seen.add(entry.target.id);
            else seen.delete(entry.target.id);
          }
          const current = nodes.find((n) => seen.has(n.id));
          if (current) setActiveId(current.id);
        },
        { rootMargin: "-80px 0px -66% 0px", threshold: 0 },
      );
      nodes.forEach((n) => observer!.observe(n));
      setActiveId(nodes[0].id);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", place);
      window.clearTimeout(unlockTimer.current);
    };
  }, []);

  if (headings.length < 2 || !pos.show) return null;

  const onJump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    // Pin the marker to the clicked section and hold it there until the scroll
    // settles, so the observer doesn't drag it through the sections in between.
    setActiveId(id);
    lockRef.current = true;
    window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      lockRef.current = false;
    }, 700);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className="article-toc" aria-label="On this page" style={{ left: pos.left }}>
      <p className="article-toc-title mono">On this page</p>
      <ul>
        {headings.map((h) => (
          <li key={h.id} data-level={h.level}>
            <a
              href={`#${h.id}`}
              onClick={(e) => onJump(e, h.id)}
              className={"article-toc-link mono" + (activeId === h.id ? " is-active" : "")}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
