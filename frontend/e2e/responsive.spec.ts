import { expect, test } from "@playwright/test";

import { SEED_ANALYSES, mockHealth, mockHistory } from "./fixtures";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

for (const viewport of VIEWPORTS) {
  test(`pages fit the ${viewport.width}px viewport without horizontal scrolling`, async ({
    page,
  }) => {
    await mockHealth(page);
    await mockHistory(page, SEED_ANALYSES);
    await page.setViewportSize(viewport);

    for (const path of ["/", "/history"]) {
      await page.goto(path);

      if (path === "/history") {
        await expect(
          page.getByRole("link", { name: "Open analysis for Margherita pizza" }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("heading", { name: /Snap a dish/ }),
        ).toBeVisible();
      }

      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);

      const main = page.locator("main");
      await expect(main).toBeVisible();
    }
  });
}

test("the mobile delete dialog fits and is keyboard dismissible", async ({ page }) => {
  await mockHealth(page);
  await mockHistory(page, SEED_ANALYSES);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/history");

  await page.getByRole("button", { name: "Delete Sushi Platter" }).click();

  const dialog = page.getByRole("dialog", { name: "Delete this analysis?" });
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);

  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
