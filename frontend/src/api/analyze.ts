import { registerMockAnalysis } from "./history";
import { ApiErrorException } from "./http";
import type { Analysis } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const MOCK_DELAY_MS = 2_000;

export class AnalyzeError extends ApiErrorException {
  constructor(code: string, message: string) {
    super({ code, message });
    this.name = "AnalyzeError";
  }
}

export async function analyzeImage(file: File): Promise<Analysis> {
  if (USE_MOCK) {
    return mockAnalyzeImage(file);
  }

  const formData = new FormData();
  formData.append("image", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new AnalyzeError(
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw await toAnalyzeError(response);
  }

  return (await response.json()) as Analysis;
}

async function toAnalyzeError(response: Response): Promise<AnalyzeError> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error body: fall back to the status code below.
  }

  const apiError = extractApiError(payload);
  if (apiError) {
    return new AnalyzeError(apiError.code, apiError.message);
  }

  if (response.status === 413) {
    return new AnalyzeError(
      "IMAGE_TOO_LARGE",
      "That image is too large. Please choose one under 5 MB.",
    );
  }

  return new AnalyzeError(
    "ANALYSIS_FAILED",
    `Analysis failed (HTTP ${response.status}). Please try again.`,
  );
}

function extractApiError(
  value: unknown,
): { code: string; message: string } | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const { error } = value as { error?: unknown };
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === "string" && typeof message === "string"
    ? { code, message }
    : null;
}

type MockAnalysis = Pick<
  Analysis,
  "label" | "confidence" | "uncertain" | "top3" | "ingredients" | "steps"
>;

const CONFIDENT_MOCK: MockAnalysis = {
  label: "Margherita pizza",
  confidence: 0.94,
  uncertain: false,
  top3: [
    { label: "Pizza", score: 0.94 },
    { label: "Bruschetta", score: 0.04 },
    { label: "Garlic bread", score: 0.02 },
  ],
  ingredients: [
    "500 g pizza dough",
    "200 g crushed San Marzano tomatoes",
    "250 g fresh mozzarella",
    "1 handful fresh basil leaves",
    "2 tbsp extra virgin olive oil",
    "1 tsp sea salt",
    "1 clove garlic",
    "1 pinch dried oregano",
  ],
  steps: [
    "Heat the oven to 250 C with a pizza stone inside.",
    "Stretch the dough into a 30 cm round on a floured peel.",
    "Spread the crushed tomatoes and season with salt and oregano.",
    "Tear the mozzarella over the top and drizzle with olive oil.",
    "Bake for 8 to 10 minutes until the crust is charred and bubbly.",
    "Finish with fresh basil and a last drizzle of olive oil.",
  ],
};

const UNCERTAIN_MOCK: MockAnalysis = {
  label: "Ramen",
  confidence: 0.32,
  uncertain: true,
  top3: [
    { label: "Ramen", score: 0.32 },
    { label: "Pho", score: 0.28 },
    { label: "Udon", score: 0.21 },
  ],
  ingredients: [],
  steps: [],
};

let mockCallCount = 0;

async function mockAnalyzeImage(file: File): Promise<Analysis> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  // Alternate responses so both the confident and uncertain variants can be
  // exercised during development.
  mockCallCount += 1;
  const variant = mockCallCount % 2 === 0 ? UNCERTAIN_MOCK : CONFIDENT_MOCK;

  return registerMockAnalysis({
    ...variant,
    id: crypto.randomUUID(),
    image_url: URL.createObjectURL(file),
    created_at: new Date().toISOString(),
  });
}
