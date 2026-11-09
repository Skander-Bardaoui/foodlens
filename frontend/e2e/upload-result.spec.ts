import { expect, test } from "@playwright/test";

import { analysis, mockHealth, mockHistory } from "./fixtures";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test("upload a photo and land on the generated result", async ({ page }) => {
  const result = analysis({ id: "e2e-upload-1" });

  await mockHealth(page);
  const history = await mockHistory(page, []);
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ status: 201, json: result }),
  );

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Drop your food photo here or click to browse",
    }),
  ).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "dish.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_BASE64, "base64"),
  });

  await expect(page.getByText("dish.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Analyze this dish" }).click();

  await expect(page).toHaveURL(/\/result\/e2e-upload-1$/);
  await expect(
    page.getByRole("heading", { name: "Margherita pizza" }),
  ).toBeVisible();
  await expect(page.getByText("fresh mozzarella")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recipe steps" }),
  ).toBeVisible();
  expect(history.getItems()).toHaveLength(0);
});
