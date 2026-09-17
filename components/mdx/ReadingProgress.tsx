"use client";

import { useEffect, useRef } from "react";

// Read the article's own scroll container on desktop and the document on mobile.
// The visual follows the scroll directly without a React render or width animation.
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const pane = barRef.current?.closest<HTMLElement>("[data-editor-scroll]");
    const update = () => {
      frame = 0;
      const inPane = !!pane && (pane.scrollTop > 0 || /auto|scroll/.test(getComputedStyle(pane).overflowY));
      const total = inPane
        ? pane.scrollHeight - pane.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const position = inPane ? pane.scrollTop : window.scrollY;
      const progress = total > 0 ? Math.max(0, Math.min(1, position / total)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = (event: Event) => {
      if (event.type === "scroll" && event.target !== document && event.target !== window && event.target !== pane) return;
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(update);
    }) : null;
    if (pane) observer?.observe(pane);
    if (pane?.firstElementChild) observer?.observe(pane.firstElementChild);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={barRef} className="reading-progress" style={{ transform: "scaleX(0)" }} aria-hidden="true" />;
}
