import { expect, test, type Page } from "@playwright/test";

/* Terminal editing: the drawn caret is where the input's real caret is,
   completion acts only at the end of the line, Shift+Tab leaves, and the mute
   switch silences the typing piano too. */

const input = (page: Page) => page.getByRole("textbox", { name: "Terminal input" });
const live = (page: Page) => page.locator(".ide-terminal-live");

async function openTerminal(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Open terminal" }).click();
  await expect(input(page)).toBeFocused();
}

test("the drawn caret follows Home, arrows and End", async ({ page }) => {
  await openTerminal(page);
  await page.keyboard.type("hel");
  // At the end: the block sits on the ghost suggestion for `help`.
  await expect(live(page).locator(".ide-terminal-caret-char")).toHaveText("p");

  await page.keyboard.press("Home");
  await expect(live(page).locator(".ide-terminal-caret-char")).toHaveText("h");
  await expect(live(page).locator(".ide-terminal-ghost")).toHaveCount(0);

  // Right moves the caret; it does not accept the suggestion mid-line.
  await page.keyboard.press("ArrowRight");
  await expect(live(page).locator(".ide-terminal-caret-char")).toHaveText("e");
  await expect(input(page)).toHaveValue("hel");

  // Tab mid-line does not complete either.
  await page.keyboard.press("Tab");
  await expect(input(page)).toHaveValue("hel");
  await expect(input(page)).toBeFocused();

  // Typing mid-line inserts at the caret.
  await page.keyboard.type("x");
  await expect(input(page)).toHaveValue("hxel");
  await expect(live(page).locator(".ide-terminal-caret-char")).toHaveText("e");

  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Home");
  await page.keyboard.press("Delete");
  await expect(input(page)).toHaveValue("xe");
  await page.keyboard.press("End");
  await expect(live(page).locator(".ide-terminal-caret")).toHaveCount(1);
});

test("Tab completes at the end of the line and Right accepts the ghost", async ({ page }) => {
  await openTerminal(page);
  await page.keyboard.type("hel");
  await page.keyboard.press("Tab");
  await expect(input(page)).toHaveValue("help");

  await input(page).fill("");
  await page.keyboard.type("hel");
  await page.keyboard.press("ArrowRight");
  await expect(input(page)).toHaveValue("help");
});

test("Shift+Tab moves focus out of the terminal input", async ({ page }) => {
  await openTerminal(page);
  await page.keyboard.press("Shift+Tab");
  await expect(input(page)).not.toBeFocused();
});

test("terminal output is a named log", async ({ page }) => {
  await openTerminal(page);
  await expect(page.getByRole("log", { name: "Terminal output" })).toBeAttached();
});

test("muting silences the typing piano", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __oscillators: number };
    w.__oscillators = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.__oscillators += 1;
      return original.call(this);
    };
  });
  await openTerminal(page);
  const oscillators = () => page.evaluate(() => (window as unknown as { __oscillators: number }).__oscillators);

  // Positive control: unmuted typing plays notes.
  const before = await oscillators();
  await page.keyboard.type("abc");
  await expect.poll(oscillators).toBeGreaterThan(before);

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mute UI sounds" }).click();
  await page.getByRole("button", { name: "Open terminal" }).click();
  await expect(input(page)).toBeFocused();
  const muted = await oscillators();
  await page.keyboard.type("defgh");
  await page.waitForTimeout(200);
  expect(await oscillators()).toBe(muted);
});

test("the cursor quip bubble has no pop-in with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // The bubble's stylesheet contract, checked on a bare element of its class.
  const name = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "cursor-bubble";
    document.body.append(el);
    const value = getComputedStyle(el).animationName;
    el.remove();
    return value;
  });
  expect(name).toBe("none");
});

test("commands walk the tree, navigate, switch theme, search and clear", async ({ page }) => {
  await openTerminal(page);
  const log = page.getByRole("log");
  const enter = async (line: string) => {
    await input(page).fill(line);
    await input(page).press("Enter");
  };

  await enter("cd projects");
  await expect(page).toHaveURL(/\/projects$/);
  await expect(live(page)).toContainText("projects %");
  await enter("ls");
  await expect(log).toContainText("cogito.tsx");

  await enter("open cogito");
  await expect(page).toHaveURL(/\/projects\/cogito$/);

  await enter("theme");
  await expect(log).toContainText("themes: ");
  const other = (await log.innerText()).match(/themes: (.+)/)![1].split(", ")[1];
  await enter(`theme ${other}`);
  await expect(log).toContainText(`theme → ${other}`);
  await expect(page.getByRole("button", { name: `Theme: ${other}` }).first()).toHaveAttribute("aria-pressed", "true");

  await enter("grep cogito");
  await expect(log).toContainText("/projects/cogito");

  await enter("clear");
  await expect(log).not.toContainText("grep cogito");
});
