import type { Cert } from "@/data/certs";

/* Single source of truth for the badge FACE artwork: a vector seal (tick-ring
   medallion + checkmark + ribbon tails), a certificate frame, faint guilloché,
   and the credential text. One SVG drives BOTH renderers — inlined in the CSS
   fallback (DOM) and rasterized to a CanvasTexture for the R3F badge — so they
   never drift and stay crisp at any size. System fonts only: a rasterized SVG
   can't reach the page's @font-face fonts, so we keep both paths identical. */

const SANS = "ui-sans-serif,system-ui,-apple-system,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,Menlo,monospace";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrapName(name: string, max = 16): string[] {
  const words = name.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

export function badgeFaceSvg(cert: Cert): string {
  const accent = cert.accent ?? "#c9a23a";
  const dark = "#463f33";
  const muted = "#726552";
  const cream = "#fbf6ea";

  const lines = wrapName(cert.name);
  const two = lines.length > 1;
  const nameYs = two ? [252, 278] : [264];
  const nameSvg = lines
    .map(
      (ln, i) =>
        `<text x="150" y="${nameYs[i]}" text-anchor="middle" font-family="${SANS}" font-size="22" font-weight="700" letter-spacing="-0.3" fill="${dark}">${esc(ln)}</text>`,
    )
    .join("");
  const issuerY = (two ? 278 : 264) + 28;
  const dividerY = issuerY + 22;
  const yearY = dividerY + 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
  <defs>
    <radialGradient id="seal" cx="38%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="48%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.10"/>
      <stop offset="32%" stop-color="${cream}"/>
      <stop offset="100%" stop-color="${cream}"/>
    </linearGradient>
  </defs>

  <rect width="300" height="400" fill="${cream}"/>
  <rect width="300" height="400" fill="url(#paper)"/>

  <!-- faint guilloché behind the seal -->
  <g stroke="${accent}" fill="none" opacity="0.06">
    <circle cx="150" cy="118" r="72"/>
    <circle cx="150" cy="118" r="90"/>
    <circle cx="150" cy="118" r="108"/>
  </g>

  <!-- certificate frame -->
  <rect x="12" y="12" width="276" height="376" rx="11" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.3"/>
  <rect x="17" y="17" width="266" height="366" rx="8" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="0.8"/>

  <!-- ribbon tails (behind the medallion) -->
  <path d="M139 150 L150 156 L150 208 L141 198 L132 208 Z" fill="${accent}"/>
  <path d="M161 150 L150 156 L150 208 L159 198 L168 208 Z" fill="${accent}"/>
  <path d="M132 208 L141 198 L141 205 Z" fill="#000" opacity="0.18"/>
  <path d="M168 208 L159 198 L159 205 Z" fill="#000" opacity="0.18"/>

  <!-- medallion -->
  <circle cx="150" cy="116" r="46" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="1.4 5.3"/>
  <circle cx="150" cy="116" r="37.5" fill="none" stroke="${accent}" stroke-width="2"/>
  <circle cx="150" cy="116" r="31" fill="url(#seal)"/>
  <path d="M136 117 l9.5 9.5 l19 -21.5" fill="none" stroke="${cream}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- text block -->
  <text x="150" y="${two ? 226 : 226}" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="3.5" fill="${accent}">CERTIFIED</text>
  ${nameSvg}
  <text x="150" y="${issuerY}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${muted}">${esc(cert.issuer)}</text>
  <line x1="120" y1="${dividerY}" x2="180" y2="${dividerY}" stroke="${accent}" stroke-opacity="0.4" stroke-width="1"/>
  ${cert.year ? `<text x="150" y="${yearY}" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="2" fill="${dark}">${esc(cert.year)}</text>` : ""}
</svg>`;
}
