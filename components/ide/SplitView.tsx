"use client";

/* The second pane of a split: the divider and the dropped file's body (from the
   client registry). EditorArea owns the layout and the primary pane, which stays
   the real SSR'd route, so SEO is unchanged and the route never remounts. This
   is lazily imported there — it's only needed once a file has been dropped into
   a split, so the divider and the split chrome stay out of the initial-load
   bundle. Desktop-only (md+). The body gets the file's label, so its page is a
   named region, not a second <main>. */

import { createElement, Suspense, type RefObject } from "react";
import { FileIcon } from "./FileIcon";
import { useCatalogue } from "./CatalogueProvider";
import { closeRight, setLeftFraction, MIN_FRACTION, MAX_FRACTION } from "./splitStore";
import { paneFor } from "./paneRegistry";
import { ResizeHandle } from "./ResizeHandle";

export function SplitView({
  rightHref,
  leftFraction,
  container,
}: {
  rightHref: string;
  leftFraction: number;
  container: RefObject<HTMLDivElement | null>;
}) {
  const rightBody = paneFor(rightHref);
  const label = useCatalogue().label(rightHref);
  if (!rightBody) return null;

  return (
    <>
      {/* The left pane's share as a percentage: 2% per key, like before. */}
      <ResizeHandle
        label="Resize split editor"
        className="ide-split-divider"
        controls="ide-split-left"
        orientation="vertical"
        pane="before"
        value={leftFraction * 100}
        min={MIN_FRACTION * 100}
        max={MAX_FRACTION * 100}
        step={2}
        unitsPerPx={() => 100 / (container.current?.getBoundingClientRect().width || Infinity)}
        preview={(percent) => container.current?.style.setProperty("--lf", String(percent / 100))}
        commit={(percent) => setLeftFraction(percent / 100)}
      />

      <div className="ide-split-right hidden min-w-0 flex-1 md:flex md:min-h-0 md:flex-col">
        <div className="ide-split-pane-header">
          <span className="ide-split-pane-name">
            <FileIcon name={label} className="ide-file-icon" />
            {label}
          </span>
          <button
            type="button"
            className="ide-split-pane-close"
            onClick={closeRight}
            aria-label="Close split pane"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M6.4 5A1 1 0 0 0 5 6.4L10.6 12 5 17.6A1 1 0 0 0 6.4 19L12 13.4 17.6 19A1 1 0 0 0 19 17.6L13.4 12 19 6.4A1 1 0 0 0 17.6 5L12 10.6Z" />
            </svg>
          </button>
        </div>
        <div key={rightHref} className="ide-enter flex-1 md:min-h-0 md:overflow-y-auto">
          <Suspense fallback={<div className="ide-split-loading">Loading&hellip;</div>}>
            {createElement(rightBody, { paneLabel: `${label} (split pane)` })}
          </Suspense>
        </div>
      </div>
    </>
  );
}
