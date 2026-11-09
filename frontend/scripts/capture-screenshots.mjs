import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

import { SEED_ANALYSES, mockHealth, mockHistory } from "../e2e/fixtures.ts";

const baseURL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:4174";
const outputDir = path.resolve(process.cwd(), "../docs/screenshots");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

await mockHealth(page);
await mockHistory(page, SEED_ANALYSES);

async function capture(pathname, fileName, ready) {
  await page.goto(`${baseURL}${pathname}`);
  await ready();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: true,
  });
  console.log(`captured ${fileName}`);
}

await capture("/", "upload.png", async () => {
  await page.getByRole("heading", { name: /Snap a dish/ }).waitFor();
});

await capture("/history", "history.png", async () => {
  await page.getByRole("link", { name: "Open analysis for Margherita pizza" }).waitFor();
});

await capture("/result/seed-1", "result.png", async () => {
  await page.getByRole("heading", { name: "Margherita pizza" }).waitFor();
});

await browser.close();
