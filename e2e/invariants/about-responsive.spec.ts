import { expect, test, type Locator, type Page } from "@playwright/test";

type AboutMetrics = {
  layoutWidth: number;
  portraitWidth: number;
  portraitCentered: boolean;
  twoColumns: boolean;
  visibleFlowOutOfBounds: boolean;
  proseTextOutOfBounds: boolean;
  documentOverflows: boolean;
};

async function aboutMetrics(page: Page, layout: Locator): Promise<AboutMetrics> {
  return layout.evaluate((element) => {
    const root = element as HTMLElement;
    const grid = root.querySelector<HTMLElement>(".about-grid");
    const portrait = root.querySelector<HTMLElement>(".about-portrait");
    const prose = root.querySelector<HTMLElement>(".about-prose");
    if (!grid || !portrait || !prose) throw new Error("About responsive structure was unavailable");

    const layoutBox = root.getBoundingClientRect();
    const portraitBox = portrait.getBoundingClientRect();
    const proseBox = prose.getBoundingClientRect();
    const flowBoxes = [grid, root.querySelector<HTMLElement>(".about-figure")!, prose]
      .map(child => child.getBoundingClientRect());
    const visibleFlowOutOfBounds = flowBoxes.some(box => (
      box.left < layoutBox.left - 1 || box.right > layoutBox.right + 1
    ));

    const range = document.createRange();
    const textWalker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    let proseTextOutOfBounds = false;
    for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
      range.selectNode(node);
      for (const rect of Array.from(range.getClientRects())) {
        if (rect.width > 0 && (rect.left < proseBox.left - 1 || rect.right > proseBox.right + 1)) {
          proseTextOutOfBounds = true;
        }
      }
    }

    return {
      layoutWidth: root.getBoundingClientRect().width,
      portraitWidth: portraitBox.width,
      portraitCentered: Math.abs(
        portraitBox.left - (layoutBox.left + (layoutBox.width - portraitBox.width) / 2),
      ) <= 1,
      twoColumns: proseBox.left > portraitBox.left && Math.abs(proseBox.top - portraitBox.top) < 2,
      visibleFlowOutOfBounds,
      proseTextOutOfBounds,
      documentOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
}

async function dragArticleIntoSplit(page: Page) {
  const row = await page.locator('.ide-explorer a[href="/blog/privacy-basics"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, editor.y + 140, { steps: 12 });
  await page.mouse.up();
}

async function expectCogitoPopoverContained(page: Page, layout: Locator) {
  const mention = page.locator("a.cogito-mention[href='/projects/cogito']");
  const pop = page.locator(".cogito-pop");
  await mention.hover();
  await expect(pop).toHaveCSS("opacity", "1");
  const bounds = await Promise.all([layout.boundingBox(), pop.boundingBox()]);
  const [layoutBox, popBox] = bounds;
  if (!layoutBox || !popBox) throw new Error("Cogito popover geometry was unavailable");
  expect(popBox.x).toBeGreaterThanOrEqual(layoutBox.x - 1);
  expect(popBox.x + popBox.width).toBeLessThanOrEqual(layoutBox.x + layoutBox.width + 1);
}

function expectPortraitLayout(metrics: AboutMetrics, width: number) {
  if (metrics.layoutWidth < 560) {
    expect(metrics.portraitWidth, `portrait at ${width}px`).toBeLessThanOrEqual(220);
    expect(metrics.portraitCentered, `portrait at ${width}px should not leave an asymmetric empty column`).toBe(true);
    expect(metrics.twoColumns, `About should stack below 560px of available content`).toBe(false);
  } else if (metrics.layoutWidth < 760) {
    expect(metrics.portraitWidth, `portrait at ${width}px`).toBeCloseTo(200, 0);
    expect(metrics.twoColumns, `About should use its compact two-column layout at ${width}px`).toBe(true);
  } else {
    expect(metrics.portraitWidth, `portrait at ${width}px`).toBeCloseTo(280, 0);
    expect(metrics.twoColumns, `About should use its wide two-column layout at ${width}px`).toBe(true);
  }
}

for (const width of [320, 390, 640, 767, 768, 820, 1024, 1280, 1440]) {
  test(`About compacts the portrait and never overflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/about");
    const layout = page.locator(".about-layout");
    await expect(layout).toBeVisible();

    const metrics = await aboutMetrics(page, layout);
    expectPortraitLayout(metrics, width);
    // WebKit retains scrollable overflow from the absolutely positioned Cogito popover
    // after its placement changes. The about layout clips that decorative out-of-flow
    // extent, so scrollWidth is not a user-visible overflow oracle here. Check actual
    // flow boxes and text fragments, then the shown popover and document width below.
    expect(metrics.visibleFlowOutOfBounds, `visible grid flow at ${width}px`).toBe(false);
    expect(metrics.proseTextOutOfBounds, `prose text at ${width}px`).toBe(false);
    expect(metrics.documentOverflows, `document at ${width}px`).toBe(false);
    await expectCogitoPopoverContained(page, layout);
  });
}

test("About's primary split pane uses its compact portrait layout", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/about");
  await dragArticleIntoSplit(page);
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toBeVisible();

  const layout = page.locator(".ide-split-left .about-layout");
  await expect(layout).toBeVisible();
  const metrics = await aboutMetrics(page, layout);
  expectPortraitLayout(metrics, 1024);
  expect(metrics.visibleFlowOutOfBounds).toBe(false);
  expect(metrics.proseTextOutOfBounds).toBe(false);
  expect(metrics.documentOverflows).toBe(false);
});

test("Cogito is the first featured project on the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("a.proj-card").first()).toHaveAttribute("href", "/projects/cogito");
});
