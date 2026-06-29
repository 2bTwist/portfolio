import { describe, it, expect, beforeEach } from "vitest";
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
  beforeEach(() => {
    act(() => {
      closeRight();
      setLeftFraction(0.5);
    });
    localStorage.clear();
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
