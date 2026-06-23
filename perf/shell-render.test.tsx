import { describe, it, expect, vi } from "vitest";
import { Profiler } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// next/navigation is a server/runtime API; stub it so the IDE store can mount
// in jsdom. Pathname is static here — we're measuring re-renders from state, not
// navigation.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

import { IdeProvider, useSession, useOverlay } from "@/components/ide/store";

/* Render-waste gate for the shell (plan Testing Strategy). Opening the command
   palette / terminal must NOT re-render consumers that only read session state
   (the explorer/tabs). With a single combined context those consumers re-commit
   on every overlay toggle — this gate catches exactly that. */

function SessionProbe({ onRender }: { onRender: () => void }) {
  return (
    <Profiler id="session" onRender={onRender}>
      <SessionReader />
    </Profiler>
  );
}

function SessionReader() {
  const { tabs } = useSession();
  return <div data-testid="tabs">{tabs.length}</div>;
}

function OverlayTrigger() {
  const { openCmdk } = useOverlay();
  return (
    <button type="button" onClick={() => openCmdk()}>
      open-cmdk
    </button>
  );
}

describe("shell render-waste gate", () => {
  it("opening the command palette does not re-render session consumers", () => {
    let commits = 0;
    render(
      <IdeProvider>
        <SessionProbe onRender={() => { commits++; }} />
        <OverlayTrigger />
      </IdeProvider>,
    );

    const afterMount = commits; // baseline (mount commits)
    fireEvent.click(screen.getByText("open-cmdk"));

    // The explorer/tabs read only session state; toggling the overlay must not
    // commit them again.
    expect(commits).toBe(afterMount);
  });
});
