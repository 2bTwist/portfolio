import { describe, it, expect, vi } from "vitest";
import { Profiler } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// next/navigation is a server/runtime API; stub it so the IDE store can mount
// in jsdom. Pathname is static here — we're measuring re-renders from state, not
// navigation.
const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  // Stable like Next's AppRouterContext: a new mock object here would make
  // callback identities change independently of the state under test.
  useRouter: () => router,
}));

import { IdeProvider, useSession, useOverlay, useTabSession } from "@/components/ide/store";

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

function TabSessionProbe({ onRender }: { onRender: () => void }) {
  return (
    <Profiler id="tab-session" onRender={onRender}>
      <TabSessionReader />
    </Profiler>
  );
}

function TabSessionReader() {
  const { tabs, openTab, closeTab } = useTabSession();
  return (
    <>
      <output data-testid="tab-count">{tabs.length}</output>
      <button type="button" onClick={() => openTab("/about")}>
        open-tab
      </button>
      <button type="button" onClick={() => closeTab("/about")}>
        close-tab
      </button>
    </>
  );
}

function PaletteTrigger() {
  const { setPaletteIndex } = useSession();
  return (
    <button type="button" onClick={() => setPaletteIndex(1)}>
      change-palette
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

  it("changing the palette skips tab-only consumers while tab actions still update them", () => {
    let commits = 0;
    render(
      <IdeProvider>
        <TabSessionProbe onRender={() => { commits++; }} />
        <PaletteTrigger />
      </IdeProvider>,
    );

    const afterMount = commits;
    fireEvent.click(screen.getByText("change-palette"));
    expect(commits).toBe(afterMount);

    fireEvent.click(screen.getByText("open-tab"));
    expect(screen.getByTestId("tab-count").textContent).toBe("2");
    expect(commits).toBeGreaterThan(afterMount);

    const afterOpen = commits;
    fireEvent.click(screen.getByText("close-tab"));
    expect(screen.getByTestId("tab-count").textContent).toBe("1");
    expect(commits).toBeGreaterThan(afterOpen);
  });
});
