/* File-type + folder icons for the explorer/tabs (Phosphor, duotone for the
   playful "clicky" look). Imported from the SSR entry so it works in server and
   client components and tree-shakes to only the icons used. */

import { File, FileMd, FileTs, FileTsx, Folder, FolderOpen } from "@phosphor-icons/react/ssr";

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
