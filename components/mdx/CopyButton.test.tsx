import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
});

describe("CopyButton", () => {
  it("contains a clipboard rejection and exposes the failure to assistive technology", async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    stubClipboard(writeText);

    render(<CopyButton text="const value = 1" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toMatch(/unable to copy.*try again|copy.*manually/i);
    });
    expect(screen.getByRole("button", { name: /copy failed|unable to copy/i })).toBeTruthy();
  });

  it("announces copied only after clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<CopyButton text="const value = 1" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
    });
  });
});
