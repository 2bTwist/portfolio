import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useSplit,
  openRight,
  closeRight,
  setLeftFraction,
  MIN_FRACTION,
  MAX_FRACTION,
} from "./splitStore";

/* Behavior gate for the split-editor store: pane open/close and a persisted,
   clamped divider ratio. The store is a module singleton, so reset it before
   each case. */

describe("split store", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    act(() => {
      closeRight();
      setLeftFraction(0.5);
    });
    localStorage.clear();
  });

  it("falls back to the default ratio when persisted storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage access is denied", "SecurityError");
    });

    const { result } = renderHook(() => useSplit());
    expect(result.current.leftFraction).toBe(0.5);
  });

  it("updates the in-memory ratio when persistence is denied", () => {
    const { result } = renderHook(() => useSplit());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage access is denied", "SecurityError");
    });

    act(() => setLeftFraction(0.65));
    expect(result.current.leftFraction).toBeCloseTo(0.65);
  });

  it("starts as a single pane with a half split", () => {
    const { result } = renderHook(() => useSplit());
    expect(result.current.rightHref).toBe(null);
    expect(result.current.leftFraction).toBe(0.5);
  });

  it("openRight sets the pane and closeRight clears it", () => {
    const { result } = renderHook(() => useSplit());
    act(() => openRight("/music"));
    expect(result.current.rightHref).toBe("/music");
    act(() => openRight("/about")); // replacing the pane
    expect(result.current.rightHref).toBe("/about");
    act(() => closeRight());
    expect(result.current.rightHref).toBe(null);
  });

  it("setLeftFraction persists and clamps to bounds", () => {
    const { result } = renderHook(() => useSplit());
    act(() => setLeftFraction(0.65));
    expect(result.current.leftFraction).toBeCloseTo(0.65);
    expect(localStorage.getItem("ide-split-ratio")).toBe("0.65");

    act(() => setLeftFraction(0.99));
    expect(result.current.leftFraction).toBe(MAX_FRACTION);

    act(() => setLeftFraction(0.01));
    expect(result.current.leftFraction).toBe(MIN_FRACTION);
  });
});
