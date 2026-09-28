/* Tour anchors (see CONTEXT.md): parts of the site a post can point readers at by
   name. The owner declares the anchor; the post and its styles select on the name,
   never on the owner's class names. Server- and client-importable. */

export type TourAnchor =
  | "explorer-edge" // the explorer's resize handle
  | "themes"; // the compact header's theme swatches

export function tourAnchor(name: TourAnchor) {
  return { "data-tour": name };
}

export function tourSelector(...names: TourAnchor[]) {
  return names.map((name) => `[data-tour="${name}"]`).join(", ");
}
