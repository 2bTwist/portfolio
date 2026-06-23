import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.URL || "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(url);
const res = await new AxeBuilder({ page }).analyze();
const cc = res.violations.filter((v) => v.id === "color-contrast");
if (!cc.length) {
  console.log("no color-contrast violations");
} else {
  for (const v of cc) {
    console.log(`impact=${v.impact} nodes=${v.nodes.length}`);
    for (const n of v.nodes) {
      console.log("  target:", n.target.join(" "));
      console.log("  data:", JSON.stringify(n.any?.[0]?.data));
      console.log("  html:", n.html.slice(0, 140));
    }
  }
}
await browser.close();
