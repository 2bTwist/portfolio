import { expect, test, type Locator, type Page } from "@playwright/test";

/* Affordances (CONTEXT.md: interface sound, tour anchor). Each control plays the sound
   it declares, at every width, whatever its class names; the pointing hand follows HTML
   semantics; the "Want to see one?" hint marks exactly one target at each width and
   clears once the reader touches it. Sounds are read from the performance marks the
   sound provider records as it plays, so no audio is needed. Controls are found by role
   and name, never by class. */

const DESKTOP = { width: 1280, height: 800 };
const COMPACT = { width: 390, height: 800 };
const POST = "/blog/you-cant-prompt-taste";

// Presses stay on the page they started on: links and downloads do not navigate, while
// React's own handlers (folder toggles, swatches, overlays) still run.
async function open(page: Page, path: string, viewport = DESKTOP) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => document.addEventListener("click", (e) => e.preventDefault(), true));
  await page.goto(path);
  await hydrated(page);
}

// Sound delegation and the hint attach in effects; the explorer's client-only icons
// mount right after them.
async function hydrated(page: Page) {
  await page.locator("#ide-explorer svg").first().waitFor({ state: "attached" });
}

async function soundsDuring(page: Page, act: () => Promise<void>) {
  await page.evaluate(() => performance.clearMarks());
  await act();
  return page.evaluate(() =>
    performance
      .getEntriesByType("mark")
      .map((m) => m.name)
      .filter((n) => n.startsWith("sound:"))
      .map((n) => n.slice("sound:".length)),
  );
}

// The pointer arrives first, so a hover sound is not counted as the press.
async function press(page: Page, target: Locator) {
  await target.hover();
  return soundsDuring(page, async () => {
    await page.mouse.down();
    await page.mouse.up();
  });
}

async function hover(page: Page, target: Locator) {
  await page.mouse.move(1, 1);
  return soundsDuring(page, () => target.hover());
}

// The title bar's command center; its click handler is live once hydrated.
async function openPalette(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await page.getByRole("button", { name: /search files and posts$/ }).click();
  await dialog.waitFor();
  return dialog;
}

const main = (page: Page) => page.locator("main");
const explorer = (page: Page) => page.locator("#ide-explorer");
const statusBar = (page: Page) => page.locator("footer");
const tabs = (page: Page) => page.locator('[aria-label="Open files"]');
const tile = (page: Page, name: string) =>
  main(page).getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) }).locator("span").first();

type Case = { name: string; path?: string; viewport?: typeof DESKTOP; run: (page: Page) => Promise<string[]>; expected: string[] };

const cases: Case[] = [
  { name: "an action button presses", run: (p) => press(p, main(p).getByRole("link", { name: "Resume", exact: true })), expected: ["press"] },
  { name: "a social link pops", run: (p) => press(p, main(p).getByRole("link", { name: "GitHub" }).first()), expected: ["pop"] },
  { name: "a plain link is silent", run: (p) => press(p, main(p).getByRole("link", { name: "more about me" })), expected: [] },
  { name: "a tech tile presses", run: (p) => press(p, tile(p, "TypeScript")), expected: ["press"] },
  { name: "a tech tile ticks on hover", run: (p) => hover(p, tile(p, "TypeScript")), expected: ["slide"] },
  { name: "a flip tile whooshes on hover", run: (p) => hover(p, tile(p, "Postgres")), expected: ["flip"] },
  { name: "the Claude tile presses", run: (p) => press(p, tile(p, "Claude")), expected: ["press"] },
  { name: "the Claude tile ticks on hover", run: (p) => hover(p, tile(p, "Claude")), expected: ["slide"] },
  { name: "an explorer file row views", run: (p) => press(p, explorer(p).getByRole("link", { name: "about.md" })), expected: ["view"] },
  {
    name: "an explorer folder row opens and closes with its state",
    run: async (p) => {
      const folder = explorer(p).getByRole("link", { name: "projects/" });
      const sounds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const expanded = await folder.getAttribute("aria-expanded");
        const heard = await press(p, folder);
        sounds.push(`${expanded}:${heard.join(",")}`);
        await expect(folder).not.toHaveAttribute("aria-expanded", expanded!);
      }
      return sounds;
    },
    expected: ["true:close", "false:open"],
  },
  { name: "a tab views", run: (p) => press(p, tabs(p).getByRole("link", { name: "README.md" })), expected: ["view"] },
  { name: "a tab's close button closes", run: (p) => press(p, tabs(p).getByRole("button", { name: "Close README.md" })), expected: ["close"] },
  { name: "the resume tab action presses", path: "/resume", run: (p) => press(p, p.getByRole("link", { name: /Download PDF/ })), expected: ["press"] },
  { name: "a status bar swatch switches", run: (p) => press(p, statusBar(p).getByRole("button", { name: /^Theme: Latte/ })), expected: ["switch"] },
  { name: "the mute pill switches", run: (p) => press(p, statusBar(p).getByRole("button", { name: "Mute UI sounds" })), expected: ["switch"] },
  { name: "the terminal pill opens", run: (p) => press(p, statusBar(p).getByRole("button", { name: "Open terminal" })), expected: ["open"] },
  { name: "the RSS pill opens", run: (p) => press(p, statusBar(p).getByRole("link", { name: "RSS feed" })), expected: ["open"] },
  {
    name: "the terminal's close button closes",
    run: async (p) => {
      await statusBar(p).getByRole("button", { name: "Open terminal" }).click();
      return press(p, p.getByRole("button", { name: "Close terminal" }));
    },
    expected: ["close"],
  },
  {
    name: "a command palette item views",
    run: async (p) => press(p, (await openPalette(p)).getByRole("option").first().getByRole("button")),
    expected: ["view"],
  },
  {
    name: "pressing inside the command palette is silent",
    run: async (p) => press(p, (await openPalette(p)).getByRole("combobox")),
    expected: [],
  },
  {
    name: "the command palette backdrop closes",
    run: async (p) => {
      const dialog = await openPalette(p);
      const heard = await soundsDuring(p, () => p.mouse.click(8, 8));
      await expect(dialog).toBeHidden();
      return heard;
    },
    expected: ["close"],
  },
  {
    name: "a compact header swatch switches",
    viewport: COMPACT,
    run: (p) => press(p, p.getByRole("group", { name: "Theme" }).getByRole("button", { name: /^Theme: Latte/ })),
    expected: ["switch"],
  },
];

for (const c of cases) {
  test(`sound: ${c.name}`, async ({ page }) => {
    await open(page, c.path ?? "/", c.viewport);
    expect(await c.run(page)).toEqual(c.expected);
  });
}

test("the pointing hand follows links, buttons and the disclosure summary", async ({ page }) => {
  await open(page, POST);
  const hand = page.locator("html");
  // The class is set by the same effect that attaches the cursor's move listener.
  await expect(hand).toHaveClass(/\bcursor-custom\b/);
  for (const target of [
    main(page).getByText("Want to see one?"),
    main(page).getByRole("link").first(),
    statusBar(page).getByRole("button", { name: /^Theme: / }).first(),
  ]) {
    await page.mouse.move(1, 1);
    await target.hover();
    await expect(hand, await target.evaluate((el) => el.outerHTML.slice(0, 80))).toHaveAttribute("data-cursor-hover", "true");
  }
});

/* The hint's look is its own business; what holds is that exactly one visible control
   changes appearance while it shows, and every control is back to normal once the
   reader touches it. A control's appearance here is its ::after box, where both hint
   styles draw. */
async function appearance(page: Page) {
  return page.evaluate(() => {
    const candidates = [...document.querySelectorAll<HTMLElement>('[role="separator"], [role="group"][aria-label="Theme"]')];
    return candidates
      .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden")
      .map((el) => {
        const s = getComputedStyle(el, "::after");
        return {
          who: `${el.getAttribute("role")}:${el.getAttribute("aria-label")}`,
          look: [s.content, s.backgroundColor, s.opacity, s.borderTopColor, s.borderTopStyle, s.animationName].join("|"),
        };
      });
  });
}

async function marked(page: Page, before: Awaited<ReturnType<typeof appearance>>) {
  const now = await appearance(page);
  return now.filter((a) => before.find((b) => b.who === a.who)?.look !== a.look).map((a) => a.who);
}

for (const [label, viewport, target, touch] of [
  ["desktop", DESKTOP, "separator:Resize file explorer", (p: Page) => p.getByRole("separator", { name: "Resize file explorer" })],
  ["compact", COMPACT, "group:Theme", (p: Page) => p.getByRole("group", { name: "Theme" }).getByRole("button", { pressed: true })],
] as const) {
  test(`the hint marks one target on ${label} and clears once it is touched`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(POST);
    await hydrated(page);
    const summary = page.getByText("Want to see one?");
    await summary.scrollIntoViewIfNeeded();
    const before = await appearance(page);
    await summary.click();
    await expect.poll(() => marked(page, before)).toEqual([target]);

    // Pressing the swatch that is already chosen leaves the palette, and so every
    // other colour, as it was.
    const control = touch(page);
    const box = (await control.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.move(1, 1);
    await expect.poll(() => marked(page, before)).toEqual([]);
  });
}
