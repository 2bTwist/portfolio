import { chromium, devices, request } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.URL || "http://localhost:3000";
const out = "perf-results/shots";
mkdirSync(out, { recursive: true });

// 1. SSR checks — raw HTML, no JS executed (equivalent to curl / JS-off crawler)
const api = await request.newContext({ baseURL: base });
const checks = [
  ["/", "Edmond Ndanji"],
  ["/", "Featured work"],
  ["/about", "Skills"],
  ["/experience", "Software Engineer"],
  ["/projects", "Pocket Studio"],
  ["/projects/ledger", "double-entry"],
  ["/projects/tempo", "habit tracker"],
  ["/contact", "interesting work"],
];
console.log("=== SSR (raw HTML, no JS) ===");
let allOk = true;
for (const [path, needle] of checks) {
  const res = await api.get(path);
  const html = await res.text();
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const ok = res.ok() && html.includes(needle);
  if (!ok) allOk = false;
  console.log(`${ok ? "OK  " : "FAIL"} ${path}  [${title}]  (${needle})`);
}
const notFound = await api.get("/projects/nope");
console.log(`404 check /projects/nope -> ${notFound.status()}`);
await api.dispose();

// 2. Screenshots
const browser = await chromium.launch();
const desk = await browser.newContext({ viewport: { width: 1280, height: 850 } });
for (const [name, path] of [
  ["home", "/"],
  ["projects", "/projects"],
  ["project-detail", "/projects/ledger"],
  ["about", "/about"],
  ["contact", "/contact"],
]) {
  const page = await desk.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await page.close();
}
await desk.close();

const mob = await browser.newContext({ ...devices["iPhone 13"] });
{
  const page = await mob.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/home-mobile.png`, fullPage: true });
  await page.close();
}
await mob.close();

// 3. JS DISABLED — proves the plain-site fallback (design law)
const nojs = await browser.newContext({ viewport: { width: 1280, height: 850 }, javaScriptEnabled: false });
{
  const page = await nojs.newPage();
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: `${out}/home-nojs.png`, fullPage: true });
  const text = await page.locator("body").innerText();
  console.log("=== JS DISABLED ===");
  console.log("name present:", text.includes("Edmond Ndanji"));
  console.log("featured work present:", text.includes("Featured work"));
  console.log("nav links present:", text.includes("projects") && text.includes("contact"));
  await page.close();
}
await nojs.close();
await browser.close();
console.log(allOk ? "ALL SSR OK; shots in " + out : "SOME SSR CHECKS FAILED");
