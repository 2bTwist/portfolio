"use client";

/* "What you just handed this site" reveal. Mounted ONLY by the /privacy page,
   so it appears there and nowhere else, a few seconds after you land (long
   enough to read the page first; the timer is cleared if you navigate away).
   Shows ONCE per browser (remembered in localStorage). Gathers what the browser
   exposes client-side and what the server saw (IP + coarse geo, from
   /api/whoami), shows it back to you, and stores or sends none of it. Dismiss
   with the button, the backdrop, or Esc. It never opens over another modal: if
   the palette is open when it is ready, it waits for the palette to close. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/site/Link";
import { PREFERENCES, loadPreference, savePreference } from "@/app/lib/preferences";
import { claimModal, onModalRelease, releaseModal } from "@/components/ide/modal-owner";

// How long the optional server lookup may hold the reveal back.
const WHOAMI_TIMEOUT_MS = 2000;

interface Row {
  label: string;
  value: string;
}
interface Group {
  title: string;
  rows: Row[];
}

function gpuRenderer(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;
    return (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string) || null;
  } catch {
    return null;
  }
}

function clientRows(): Row[] {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
  };
  const gpu = gpuRenderer();
  const rows: (Row | null)[] = [
    { label: "Browser + OS", value: nav.userAgent },
    {
      label: "Screen",
      value: `${screen.width} × ${screen.height} at ${window.devicePixelRatio}x`,
    },
    { label: "Window", value: `${window.innerWidth} × ${window.innerHeight}` },
    { label: "Timezone", value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: "Languages", value: (nav.languages || [nav.language]).join(", ") },
    nav.hardwareConcurrency
      ? { label: "CPU cores", value: String(nav.hardwareConcurrency) }
      : null,
    nav.deviceMemory ? { label: "Memory", value: `${nav.deviceMemory} GB+` } : null,
    nav.connection?.effectiveType
      ? { label: "Connection", value: nav.connection.effectiveType }
      : null,
    gpu ? { label: "Graphics card", value: gpu } : null,
    {
      label: "Touchscreen",
      value: "ontouchstart" in window || nav.maxTouchPoints > 0 ? "yes" : "no",
    },
    { label: "Cookies allowed", value: nav.cookieEnabled ? "yes" : "no" },
  ];
  return rows.filter((r): r is Row => r !== null);
}

// What the edge already knows about this request, bounded by WHOAMI_TIMEOUT_MS;
// null when it is unknown, slow, or offline (the reveal then shows client data
// only). Module scope: React Compiler cannot lower try/finally in a component.
async function serverGroup(lookup: AbortController): Promise<Group | null> {
  const giveUp = window.setTimeout(() => lookup.abort(), WHOAMI_TIMEOUT_MS);
  try {
    const res = await fetch("/api/whoami", { cache: "no-store", signal: lookup.signal });
    const d = (await res.json()) as Record<string, string | null>;
    const rows: Row[] = [];
    if (d.ip) rows.push({ label: "IP address", value: d.ip });
    const place = [d.city, d.region, d.country].filter(Boolean).join(", ");
    if (place) rows.push({ label: "Approx. location", value: place });
    if (d.timezone) rows.push({ label: "Located in", value: d.timezone });
    return rows.length ? { title: "What the server already knows", rows } : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(giveUp);
  }
}

export function DataReveal() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    savePreference(PREFERENCES.dataRevealSeen, true);
    setGroups(null);
    releaseModal("privacy");
  }, []);

  // First-visit gate + deferred build. Runs once. The server lookup is optional
  // enrichment, so it is bounded: a slow or failed whoami shows the browser's
  // rows alone rather than holding the reveal back.
  useEffect(() => {
    if (loadPreference(PREFERENCES.dataRevealSeen)) return;

    let cancelled = false;
    let stopWaiting: (() => void) | undefined;
    const lookup = new AbortController();
    // Wait for any open modal (the palette) to close rather than open over it.
    const show = (built: Group[]) => {
      if (cancelled) return;
      if (claimModal("privacy")) {
        stopWaiting?.();
        setGroups(built);
      } else if (!stopWaiting) {
        stopWaiting = onModalRelease((reason) => {
          // The visitor is leaving this page; unmounting cancels the reveal,
          // which then shows on a later visit (it was never marked seen).
          if (reason === "navigation") return;
          show(built);
        });
      }
    };
    const timer = window.setTimeout(async () => {
      const client: Group = { title: "What your browser just told it", rows: clientRows() };
      const server = await serverGroup(lookup);
      show(server ? [server, client] : [client]);
    }, 3500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      lookup.abort();
      stopWaiting?.();
      releaseModal("privacy");
    };
  }, []);

  // While open: lock body scroll, focus the close button, close on Esc.
  useEffect(() => {
    if (!groups) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      } else if (e.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        );
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        const outside = !dialogRef.current?.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || outside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || outside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [groups, dismiss]);

  if (!groups) return null;

  return (
    <div className="data-reveal-backdrop" onClick={dismiss}>
      <div
        ref={dialogRef}
        className="data-reveal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-reveal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="data-reveal-close" onClick={dismiss} aria-label="Close">
          ×
        </button>
        <h2 id="data-reveal-title" className="data-reveal-title display">
          You just handed this site all of this.
        </h2>
        <p className="data-reveal-sub">
          You didn&apos;t agree to any of it, and you didn&apos;t click a thing. Every site you open
          sees roughly the same.
        </p>

        <div className="data-reveal-groups">
          {groups.map((g) => (
            <section key={g.title} className="data-reveal-group">
              <p className="data-reveal-group-title mono">{g.title}</p>
              <dl>
                {g.rows.map((r) => (
                  <div key={r.label} className="data-reveal-row">
                    <dt>{r.label}</dt>
                    <dd className="mono">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="data-reveal-foot">
          <Link
            href="/blog/privacy-basics"
            prefetch={false}
            className="data-reveal-link"
            onClick={dismiss}
          >
            What you can do about it →
          </Link>
          <button className="data-reveal-got" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
