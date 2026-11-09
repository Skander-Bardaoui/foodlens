import path from "node:path";

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type Response,
} from "@playwright/test";

import type { Analysis } from "../src/api/types";

const REAL_STACK = process.env.REAL_STACK === "1";
const API_ORIGIN = process.env.REAL_API_ORIGIN ?? "http://127.0.0.1:8000";
const SAMPLES = path.resolve(process.cwd(), "../backend/uploads/samples");
const PIZZA = path.join(SAMPLES, "pizza.jpg");
const NON_FOOD = path.resolve(
  process.cwd(),
  "../design/stitch_foodlens_ai_recipe_generator/foodlens_home_upload/screen.png",
);

async function uploadAndAnalyze(page: Page, filePath: string) {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(
    page.getByRole("button", { name: "Analyze this dish" }),
  ).toBeEnabled();

  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/analyze" &&
      response.request().method() === "POST",
    { timeout: 120_000 },
  );
  await page.getByRole("button", { name: "Analyze this dish" }).click();
  await expect(page.getByTestId("analyzing-state")).toBeVisible();
  const response = await responsePromise;
  return { response, analysis: await readAnalysis(response) };
}

async function readAnalysis(response: Response): Promise<Analysis> {
  expect(response.status()).toBe(200);
  return (await response.json()) as Analysis;
}

function uploadedAsset(imageUrl: string): string {
  return new URL(imageUrl, API_ORIGIN).toString();
}

async function expectAssetStatus(
  request: APIRequestContext,
  imageUrl: string,
  status: number,
) {
  const assetUrl = uploadedAsset(imageUrl);
  await expect
    .poll(async () => (await request.get(assetUrl)).status(), { timeout: 10_000 })
    .toBe(status);
}

async function deleteFromResult(page: Page, analysis: Analysis) {
  await page.goto(`/result/${analysis.id}`);
  await expect(page.getByRole("heading", { name: analysis.label, level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "Delete analysis" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this analysis?" });
  await expect(dialog).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      new URL(response.url()).pathname === `/api/history/${analysis.id}`,
    { timeout: 15_000 },
  );
  await dialog.getByRole("button", { name: "Delete analysis" }).click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page).toHaveURL(/\/$/);
}

async function deleteFromHistory(page: Page, analysis: Analysis) {
  await page.goto("/history");
  const card = page.locator(`[data-analysis-id="${analysis.id}"]`);
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: `Delete ${analysis.label}` }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this analysis?" });
  await expect(dialog).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      new URL(response.url()).pathname === `/api/history/${analysis.id}`,
    { timeout: 15_000 },
  );
  await dialog.getByRole("button", { name: "Delete analysis" }).click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page.getByText("Analysis deleted")).toBeVisible();
  await expect(page.locator(`[data-analysis-id="${analysis.id}"]`)).toHaveCount(0);
}

test.describe("real API integration", () => {
  test.skip(!REAL_STACK, "Set REAL_STACK=1 and PLAYWRIGHT_BASE_URL to the Docker app");

  test.describe.configure({ mode: "serial" });

  test("photo to analyzing to result, direct refresh and result delete", async ({
    page,
    request,
  }) => {
    const { analysis } = await uploadAndAnalyze(page, PIZZA);

    expect(analysis.uncertain).toBe(false);
    expect(analysis.ingredients.length).toBeGreaterThan(0);
    expect(analysis.steps.length).toBeGreaterThan(0);

    await expect(page).toHaveURL(new RegExp(`/result/${analysis.id}$`), {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: analysis.label, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recipe steps" })).toBeVisible();

    const historyCard = page.locator(`[data-analysis-id="${analysis.id}"]`);
    await page.locator("header").getByRole("link", { name: "History" }).click();
    await expect(historyCard).toBeVisible();
    await page.reload();
    await expect(historyCard).toBeVisible();

    await page.goto(`/result/${analysis.id}`);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: analysis.label, level: 1 }),
    ).toBeVisible();

    await expectAssetStatus(request, analysis.image_url, 200);
    await deleteFromResult(page, analysis);
    await expectAssetStatus(request, analysis.image_url, 404);

    await page.goto("/history");
    await expect(historyCard).toHaveCount(0);
  });

  test("uncertain photo shows suggestions and deletes from history", async ({
    page,
    request,
  }) => {
    const { analysis } = await uploadAndAnalyze(page, NON_FOOD);

    expect(analysis.uncertain).toBe(true);
    expect(analysis.ingredients).toHaveLength(0);
    expect(analysis.steps).toHaveLength(0);

    await expect(page).toHaveURL(new RegExp(`/result/${analysis.id}$`), {
      timeout: 30_000,
    });
    await expect(
      page.getByText("We're not sure about this dish. Is it one of these?"),
    ).toBeVisible();
    await expect(page.getByText("No recipe for this photo yet")).toBeVisible();

    await expectAssetStatus(request, analysis.image_url, 200);
    await deleteFromHistory(page, analysis);
    await expectAssetStatus(request, analysis.image_url, 404);
  });

  test("a 10 MB file is rejected before any upload", async ({ page }) => {
    await page.goto("/");
    let analyzeRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/analyze") analyzeRequests += 1;
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(10 * 1024 * 1024, 1),
    });

    await expect(page.getByRole("alert")).toContainText(
      "That image is 10.0 MB. Please choose one under 5 MB.",
    );
    await expect(page.getByRole("button", { name: "Analyze this dish" })).toBeDisabled();
    expect(analyzeRequests).toBe(0);
  });

  test("a failed analysis shows an inline error instead of a blank screen", async ({
    page,
  }) => {
    await page.route("**/api/analyze", (route) => route.abort("connectionrefused"));

    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(PIZZA);
    await page.getByRole("button", { name: "Analyze this dish" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Could not reach the server. Check your connection and try again.",
    );
    await expect(
      page.getByRole("button", { name: "Analyze this dish" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: /Drop your food photo here/ }),
    ).toBeVisible();
  });
});
