"use client";

/* The "more about me" arrow with a playful speech bubble above it: a shaking-fist
   Slack emoji that, on click, flips to "you better hire me! lol" for a beat
   before heading to /about. Plain <img> keeps the GIF animated (next/image would
   freeze it). */

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

export function MoreAboutMe() {
  const router = useRouter();
  const [hired, setHired] = useState(false);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (hired) {
      router.push("/about");
      return;
    }
    setHired(true);
    setTimeout(() => router.push("/about"), 1100);
  }

  return (
    <div className="more-wrap">
      <div className="more-bubble" data-hired={hired} aria-hidden="true">
        {hired ? (
          <span className="more-bubble-text">you better hire me! lol</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- animated GIF must stay unoptimized
          <img className="more-gif" src="/images/shaking-fist.gif" alt="" width={30} height={30} />
        )}
      </div>
      <a href="/about" className="hero-more mono" onClick={onClick}>
        more about me
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}
