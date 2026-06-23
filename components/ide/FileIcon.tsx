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

export function FileIcon({ name, className }: { name: string; className?: string }) {
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
