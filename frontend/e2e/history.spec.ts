import { expect, test } from "@playwright/test";

import { SEED_ANALYSES, mockHealth, mockHistory } from "./fixtures";

test("search, then delete a saved analysis from History", async ({ page }) => {
  await mockHealth(page);
  const store = await mockHistory(page, SEED_ANALYSES);

  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "Your analyses" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open analysis for Margherita pizza" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open analysis for Sushi Platter" }),
  ).toBeVisible();

  const search = page.getByRole("textbox", {
    name: "Search analyses by dish name",
  });
  await search.fill("sushi");

  await expect(
    page.getByRole("link", { name: "Open analysis for Margherita pizza" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open analysis for Sushi Platter" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Delete Sushi Platter" }).click();

  const dialog = page.getByRole("dialog", { name: "Delete this analysis?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete analysis" }).click();

  await expect(page.getByText("Analysis deleted")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open analysis for Sushi Platter" }),
  ).toHaveCount(0);
  expect(store.getItems().map((item) => item.id)).not.toContain("seed-2");
});
