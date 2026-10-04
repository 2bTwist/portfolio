/* A modified or non-primary click belongs to the browser (new tab, new window,
   download), so shell link handlers neither act on it nor prevent it. */
export function isBrowserOwnedClick(e: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}
