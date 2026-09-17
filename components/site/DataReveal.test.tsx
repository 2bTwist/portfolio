import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataReveal } from "./DataReveal";

async function renderOpenReveal() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ip: "203.0.113.1", city: null, region: null, country: null, timezone: null })),
    ),
  );
  render(<DataReveal />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3500);
    await Promise.resolve();
  });
  return screen.getByRole("dialog", { name: "You just handed this site all of this." });
}

describe("DataReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("wraps Tab and Shift+Tab within the modal", async () => {
    await renderOpenReveal();
    const close = screen.getByRole("button", { name: "Close" });
    const gotIt = screen.getByRole("button", { name: "Got it" });

    gotIt.focus();
    fireEvent.keyDown(gotIt, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(gotIt);
  });

  it("restores the previous focus when Escape dismisses the modal", async () => {
    const opener = document.createElement("button");
    opener.textContent = "Before reveal";
    document.body.append(opener);
    opener.focus();

    await renderOpenReveal();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
