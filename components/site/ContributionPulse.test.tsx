import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ContributionGridData } from "@/app/lib/github-contributions";
import { ContributionPulse } from "./ContributionPulse";

const snapshot: ContributionGridData = {
  total: 1204,
  activeDays: 3,
  months: [{ label: "Jul", weekIndex: 0 }],
  weeks: [
    {
      start: "2026-07-12",
      days: [
        { date: "2026-07-12", count: 0, level: 0 },
        { date: "2026-07-13", count: 2, level: 1 },
        { date: "2026-07-14", count: 5, level: 2 },
        { date: "2026-07-15", count: 9, level: 4 },
        null,
        null,
        null,
      ],
    },
  ],
};

class ImmediateIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "0px";
  thresholds = [0];
}

describe("ContributionPulse", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders bundled activity immediately while the live refresh is still pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    const { container } = render(<ContributionPulse initialData={snapshot} />);

    expect(
      screen.getByText("1,204 GitHub contributions across 3 active days in the last year."),
    ).toBeTruthy();
    expect(screen.queryByText("Loading the latest build activity")).toBeNull();
    expect(screen.queryByText("Build rhythm")).toBeNull();
    expect(screen.queryByText("activity.log")).toBeNull();
    expect(container.querySelector(".pulse-card")).toBeNull();
    expect(screen.queryByLabelText("Scrollable GitHub contribution graph")).toBeNull();
    expect(screen.queryByRole("button", { name: "Replay contribution animation" })).toBeNull();
    expect(screen.getByRole("link", { name: "View contributions on GitHub" }).getAttribute("href")).toBe(
      "https://github.com/2bTwist",
    );
    expect(screen.getByLabelText("GitHub contribution graph").className).toBe("pulse-grid");
  });

  it("summarizes the fetched activity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(snapshot), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<ContributionPulse initialData={{ ...snapshot, total: 0, activeDays: 0 }} />);

    expect(
      await screen.findByText("1,204 GitHub contributions across 3 active days in the last year."),
    ).toBeTruthy();
  });

  it("keeps the bundled graph visible when the background refresh fails", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<ContributionPulse initialData={snapshot} />);

    expect(
      screen.getByText("1,204 GitHub contributions across 3 active days in the last year."),
    ).toBeTruthy();
  });
});
