/* Which modal dialog owns input. At most one modal is open at a time: a
   visitor's request for a second one is refused (⌘K does nothing while the
   privacy reveal is up), and an unprompted one waits for the owner to release
   (the reveal holds back while the palette is open). Module state, not React
   state, because the palette and the reveal live in separate trees. */

export type ModalId = "palette" | "privacy";
/* Why ownership was released. "navigation" means the page is being left, so a
   modal waiting on that page must not open over it during the transition. */
export type ReleaseReason = "closed" | "navigation";

let owner: ModalId | null = null;
const listeners = new Set<(reason: ReleaseReason) => void>();

/** Take ownership. False when another modal already owns input. */
export function claimModal(id: ModalId): boolean {
  if (owner !== null && owner !== id) return false;
  owner = id;
  return true;
}

/** Give ownership back; a no-op for a modal that does not own it. */
export function releaseModal(id: ModalId, reason: ReleaseReason = "closed") {
  if (owner !== id) return;
  owner = null;
  for (const listener of [...listeners]) listener(reason);
}

/** Calls `listener` each time ownership is released. Returns the unsubscribe. */
export function onModalRelease(listener: (reason: ReleaseReason) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
