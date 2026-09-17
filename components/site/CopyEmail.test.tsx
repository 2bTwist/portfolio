import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyEmail } from "./CopyEmail";

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

describe("CopyEmail", () => {
  it("announces success only after clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<CopyEmail email="edmond@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "edmond@example.com" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("Copied to clipboard");
    });
    expect(writeText).toHaveBeenCalledWith("edmond@example.com");
  });

  it("announces an actionable failure when clipboard write rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    stubClipboard(writeText);

    render(<CopyEmail email="edmond@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: "edmond@example.com" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toMatch(/unable to copy.*copy.*manually/i);
    });
    expect(screen.getByRole("status").textContent).not.toContain("Copied to clipboard");
  });
});
