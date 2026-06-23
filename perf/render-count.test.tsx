import { describe, it, expect } from "vitest";
import { Profiler, type ReactElement, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Cheap-tier render gate (grilled decision 2/8): count React commits via the
// Profiler instead of pulling in reassure + a second runner. This is the
// per-component signal the loop polls on every iteration.
function countCommits(ui: ReactElement) {
  let commits = 0;
  const r = render(
    <Profiler id="t" onRender={() => { commits++; }}>
      {ui}
    </Profiler>,
  );
  return { commits: () => commits, ...r };
}

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>count: {n}</button>;
}

describe("render-count gate", () => {
  it("mounts a trivial component with exactly one commit", () => {
    const c = countCommits(<p>hi</p>);
    expect(c.commits()).toBe(1);
  });

  it("re-renders exactly once per state change", () => {
    const c = countCommits(<Counter />);
    expect(c.commits()).toBe(1); // initial
    fireEvent.click(screen.getByRole("button"));
    expect(c.commits()).toBe(2); // one commit per click, not more
  });
});
