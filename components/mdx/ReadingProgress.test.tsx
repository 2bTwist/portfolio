import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadingProgress } from "./ReadingProgress";

const documentHeight = Object.getOwnPropertyDescriptor(document.documentElement, "scrollHeight");
const windowHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
const windowScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");

function setScrollableMetrics(element: HTMLElement, scrollTop: number) {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 300 },
    scrollTop: { configurable: true, writable: true, value: scrollTop },
  });
}

function renderedRatio(bar: HTMLElement) {
  const transform = bar.style.transform.match(/scaleX\(([^)]+)\)/);
  if (transform) return Number(transform[1]);
  return Number.parseFloat(bar.style.width) / 100;
}

afterEach(() => {
  vi.restoreAllMocks();
  if (documentHeight) Object.defineProperty(document.documentElement, "scrollHeight", documentHeight);
  if (windowHeight) Object.defineProperty(window, "innerHeight", windowHeight);
  if (windowScrollY) Object.defineProperty(window, "scrollY", windowScrollY);
});

describe("ReadingProgress", () => {
  it("uses the desktop editor pane's scroll position", async () => {
    const { container } = render(
      <div data-editor-scroll>
        <ReadingProgress />
      </div>,
    );
    const pane = container.querySelector<HTMLElement>("[data-editor-scroll]")!;
    setScrollableMetrics(pane, 100);

    fireEvent.scroll(pane);
    await waitFor(() => expect(renderedRatio(container.querySelector(".reading-progress")!)).toBeCloseTo(0.5));
  });

  it("uses document scrolling when no desktop editor pane exists", async () => {
    Object.defineProperties(document.documentElement, {
      scrollHeight: { configurable: true, value: 300 },
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 100 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    const { container } = render(<ReadingProgress />);

    fireEvent.scroll(window);
    await waitFor(() => expect(renderedRatio(container.querySelector(".reading-progress")!)).toBeCloseTo(0.5));
  });

  it("does not let an unrelated right pane drive the routed article's progress", async () => {
    const { container } = render(
      <div data-editor-scroll>
        <ReadingProgress />
        <div data-right-pane />
      </div>,
    );
    const pane = container.querySelector<HTMLElement>("[data-editor-scroll]")!;
    const rightPane = container.querySelector<HTMLElement>("[data-right-pane]")!;
    setScrollableMetrics(pane, 0);
    setScrollableMetrics(rightPane, 200);

    fireEvent.scroll(rightPane);
    await waitFor(() => expect(renderedRatio(container.querySelector(".reading-progress")!)).toBeCloseTo(0));
  });
});
