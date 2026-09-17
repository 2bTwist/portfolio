"use client";

import { useEffect, useRef } from "react";

const POSTER = "/images/projects/cogito/cogito-transparent-poster.webp";
const MOTION = "/images/projects/cogito/cogito-transparent-hop.webp";
const DURATION = 3567;

/** The original pocket toys, rendered with alpha so their edges and shadows
 * composite against every theme. One finite play; the poster also works without JS. */
export function CogitoPreview({
  trigger = "visible",
  replayControl = false,
}: {
  trigger?: "hover" | "visible";
  replayControl?: boolean;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const preview = image.parentElement!;
    const replay = replayRef.current;
    const target = image.closest("a") ?? preview;
    const bubble = trigger === "hover" ? preview.closest<HTMLElement>(".cogito-pop") : null;
    const bounds = target.closest<HTMLElement>(".about-layout");
    const placeBubble = () => {
      if (!bubble || !bounds) return;
      const word = target.getBoundingClientRect();
      const area = bounds.getBoundingClientRect();
      const center = word.left + word.width / 2;
      const half = bubble.offsetWidth / 2;
      const clamped = Math.max(area.left + half, Math.min(center, area.right - half));
      bubble.style.setProperty("--cogito-pop-left", `${clamped - half - word.left}px`);
      bubble.style.setProperty("--cogito-pop-arrow", `${center - clamped + half}px`);
    };
    const geometry = new ResizeObserver(placeBubble);
    if (bubble && bounds) {
      geometry.observe(bounds);
      geometry.observe(target);
      target.addEventListener("focus", placeBubble);
      placeBubble();
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let visible = false;
    let played = false;
    let hovered = matchMedia("(hover: hover)").matches && target.matches(":hover");
    let disposed = false;
    let generation = 0;
    let objectURL: string | undefined;
    let source: Promise<Blob> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const allowed = () => !reduced.matches && !connection?.saveData;
    const pause = () => {
      generation++;
      clearTimeout(timer);
      preview.dataset.playing = "false";
      image.src = POSTER;
      if (objectURL) URL.revokeObjectURL(objectURL);
      objectURL = undefined;
    };
    const play = async (restart = false) => {
      if (!allowed() || document.hidden || !visible) return;
      if (objectURL && !restart) return;
      pause();
      played = true;
      const request = generation;
      try {
        source ??= fetch(MOTION).then(response => {
          if (!response.ok) throw new Error("Preview unavailable");
          return response.blob();
        });
        const blob = await source;
        if (disposed || request !== generation || !visible || !allowed() || document.hidden) return;
        // A fresh URL gives each replay its own decoder timeline, including Safari.
        objectURL = URL.createObjectURL(blob);
        image.src = objectURL;
      } catch {
        source = undefined;
        // Failed or blocked media leaves the transparent, server-rendered poster.
      }
    };
    const loaded = () => {
      if (!objectURL || image.src !== objectURL) return;
      preview.dataset.playing = "true";
      timer = setTimeout(pause, DURATION);
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovered = true;
      placeBubble();
      void play(trigger === "hover");
    };
    const leave = () => {
      hovered = false;
      if (trigger === "hover") pause();
    };
    const visibility = () => { if (document.hidden) pause(); };
    const preference = () => {
      if (replay) replay.hidden = !allowed();
      if (!allowed()) pause();
    };
    const replayMotion = () => { void play(true); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      if (!visible) pause();
      else if (trigger === "hover" && hovered) void play(true);
      else if (trigger === "visible" && !played) void play();
    }, { threshold: 0.25 });
    observer.observe(trigger === "hover" ? target : image);
    image.addEventListener("load", loaded);
    target.addEventListener("pointerenter", enter);
    target.addEventListener("pointerleave", leave);
    target.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", preference);
    replay?.addEventListener("click", replayMotion);
    preference();
    return () => {
      disposed = true;
      pause();
      observer.disconnect();
      geometry.disconnect();
      target.removeEventListener("focus", placeBubble);
      image.removeEventListener("load", loaded);
      target.removeEventListener("pointerenter", enter);
      target.removeEventListener("pointerleave", leave);
      target.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", preference);
      replay?.removeEventListener("click", replayMotion);
    };
  }, [trigger]);

  return (
    <span className="cogito-preview" data-playing="false">
      {/* eslint-disable-next-line @next/next/no-img-element -- finite alpha animation with a static SSR poster */}
      <img ref={imageRef} src={POSTER} width={960} height={540}
        alt="" aria-hidden="true" loading="lazy" decoding="async" />
      {replayControl && (
        <button ref={replayRef} type="button" className="cogito-replay" aria-label="Replay animation" hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11a9 9 0 1 1 2.64 7.36M3 4v7h7" />
          </svg>
        </button>
      )}
    </span>
  );
}
