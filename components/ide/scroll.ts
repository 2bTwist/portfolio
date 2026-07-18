/* Scroll the routed editor surface back to the top. Desktop scrolls the shell's
   [data-editor-scroll] pane (in a split, only the routed left pane carries the
   attribute); mobile has no pane overflow, so the window call covers it. Smooth
   unless the user prefers reduced motion. */
export function scrollEditorTop() {
  const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  document.querySelector("[data-editor-scroll]")?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}
