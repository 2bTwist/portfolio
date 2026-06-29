/* File-type + folder icons for the explorer/tabs (Phosphor, duotone for the
   playful "clicky" look). Imported per-icon from the SSR subpaths (NOT the
   barrel) — the barrel pulls the whole ~9k-icon index into the server render
   and added ~840ms to LCP; per-icon subpaths keep only what's used. */

import { File } from "@phosphor-icons/react/dist/ssr/File";
import { FileMd } from "@phosphor-icons/react/dist/ssr/FileMd";
import { FileTs } from "@phosphor-icons/react/dist/ssr/FileTs";
import { FileTsx } from "@phosphor-icons/react/dist/ssr/FileTsx";
import { Folder } from "@phosphor-icons/react/dist/ssr/Folder";
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen";

const ICON_SIZE = 15;

/* Award medal for certs.pdf — inlined (not Phosphor): the duotone SealCheck cost
   ~3.8 kB gzip in the always-loaded explorer bundle. Matches the duotone idiom
   (low-opacity fill + full-weight detail) at a few hundred bytes. */
function CertIcon({ className }: { className?: string }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 256 256" className={className} aria-hidden>
      <path d="M96 166 L74 232 L108 212 L128 224 L148 212 L182 232 L160 166 Z" fill="currentColor" opacity="0.2" />
      <circle cx="128" cy="104" r="80" fill="currentColor" opacity="0.2" />
      <circle cx="128" cy="104" r="80" fill="none" stroke="currentColor" strokeWidth="14" />
      <path
        d="M92 106 l24 24 l46 -52"
        fill="none"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Music note for music.mp3 — inlined for the same reason as CertIcon (keeps the
   Phosphor FileAudio out of the always-loaded explorer bundle). Duotone idiom. */
function AudioIcon({ className }: { className?: string }) {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 256 256" className={className} aria-hidden>
      <circle cx="76" cy="180" r="28" fill="currentColor" opacity="0.2" />
      <circle cx="180" cy="156" r="28" fill="currentColor" opacity="0.2" />
      <path
        d="M104 180 V72 l104 -24 v108"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="76" cy="180" r="28" fill="none" stroke="currentColor" strokeWidth="16" />
      <circle cx="180" cy="156" r="28" fill="none" stroke="currentColor" strokeWidth="16" />
    </svg>
  );
}

export function FileIcon({ name, className }: { name: string; className?: string }) {
  if (name.endsWith(".pdf")) return <CertIcon className={className} />; // certs.pdf
  if (name.endsWith(".mp3")) return <AudioIcon className={className} />; // music.mp3
  const Cmp = name.endsWith(".tsx")
    ? FileTsx
    : name.endsWith(".ts")
      ? FileTs
      : name.endsWith(".md")
        ? FileMd
        : File;
  return <Cmp size={ICON_SIZE} weight="duotone" className={className} aria-hidden />;
}

export function FolderIcon({ open }: { open: boolean }) {
  const Cmp = open ? FolderOpen : Folder;
  return <Cmp size={ICON_SIZE} weight="duotone" className="ide-file-icon" aria-hidden />;
}
