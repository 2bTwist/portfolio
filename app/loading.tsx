import { BrailleLoader } from "@/components/feel/BrailleLoader";

/* Route-level loading UI — the braille loader centered in the editor pane. */
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24" style={{ color: "var(--muted)" }}>
      <BrailleLoader label="Loading page" />
    </div>
  );
}
