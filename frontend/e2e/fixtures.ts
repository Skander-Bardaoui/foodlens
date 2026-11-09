import type { Page } from "@playwright/test";

export type E2EAnalysis = {
  id: string;
  label: string;
  confidence: number;
  uncertain: boolean;
  top3: Array<{ label: string; score: number }>;
  ingredients: string[];
  steps: string[];
  image_url: string;
  created_at: string;
};

export const DISH_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23f97316'/%3E%3Ccircle cx='320' cy='240' r='120' fill='%23ffdbca'/%3E%3C/svg%3E";

export function analysis(overrides: Partial<E2EAnalysis> = {}): E2EAnalysis {
  return {
    id: "seed-1",
    label: "Margherita pizza",
    confidence: 0.97,
    uncertain: false,
    top3: [
      { label: "Margherita pizza", score: 0.97 },
      { label: "Focaccia", score: 0.02 },
      { label: "Bruschetta", score: 0.01 },
    ],
    ingredients: ["pizza dough", "San Marzano tomatoes", "fresh mozzarella", "basil"],
    steps: ["Stretch the dough.", "Add toppings and bake until bubbly."],
    image_url: DISH_IMAGE,
    created_at: "2026-11-09T12:00:00.000Z",
    ...overrides,
  };
}

export const SEED_ANALYSES: E2EAnalysis[] = [
  analysis(),
  analysis({
    id: "seed-2",
    label: "Sushi Platter",
    confidence: 0.94,
    top3: [
      { label: "Sushi Platter", score: 0.94 },
      { label: "Sashimi Platter", score: 0.04 },
      { label: "Onigiri", score: 0.02 },
    ],
    ingredients: ["sushi rice", "salmon", "nori"],
    steps: ["Season the rice.", "Shape and slice."],
    created_at: "2026-11-08T12:00:00.000Z",
  }),
  analysis({
    id: "seed-3",
    label: "Tonkotsu ramen",
    confidence: 0.89,
    top3: [
      { label: "Tonkotsu ramen", score: 0.89 },
      { label: "Shoyu ramen", score: 0.07 },
      { label: "Miso ramen", score: 0.04 },
    ],
    ingredients: ["ramen noodles", "pork broth", "soft-boiled egg"],
    steps: ["Simmer the broth.", "Cook the noodles."],
    created_at: "2026-11-07T12:00:00.000Z",
  }),
];

export async function mockHealth(page: Page): Promise<void> {
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { status: "ok" } }),
  );
}

export async function mockHistory(
  page: Page,
  initialItems: E2EAnalysis[],
): Promise<{ getItems: () => E2EAnalysis[] }> {
  let items = [...initialItems];

  await page.route(/\/api\/history(?:\/[^/?#]+)?(?:\?[^#]*)?$/, async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/\/+$/, "");

    if (request.method() === "DELETE") {
      const id = pathname.split("/").at(-1) ?? "";
      items = items.filter((item) => item.id !== id);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (!pathname.endsWith("/history")) {
      const id = pathname.split("/").at(-1) ?? "";
      const item = items.find((analysis) => analysis.id === id);
      await route.fulfill(
        item ? { json: item } : { status: 404, json: { error: { code: "NOT_FOUND", message: "Not found" } } },
      );
      return;
    }

    await route.fulfill({ json: { items, total: items.length } });
  });

  return { getItems: () => items };
}
