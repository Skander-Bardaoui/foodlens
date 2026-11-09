import type { Analysis, ApiError } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const MOCK_DELAY_MS = 250;

export class HistoryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HistoryError";
    this.code = code;
  }
}

// TODO: remove this in-memory store once the history API is merged.
const mockAnalyses = new Map<string, Analysis>();

export function registerMockAnalysis(analysis: Analysis): Analysis {
  if (USE_MOCK) {
    mockAnalyses.set(analysis.id, analysis);
  }
  return analysis;
}

// TODO: align with the history API once the other developer's implementation lands.
export async function getAnalysis(id: string): Promise<Analysis> {
  if (USE_MOCK) {
    await delay(MOCK_DELAY_MS);
    const analysis = mockAnalyses.get(id);
    if (!analysis) {
      throw new HistoryError(
        "NOT_FOUND",
        "We couldn't find that analysis. It may have been deleted.",
      );
    }
    return analysis;
  }

  const response = await request(`${API_BASE}/history/${encodeURIComponent(id)}`);
  return (await response.json()) as Analysis;
}

export async function deleteAnalysis(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(MOCK_DELAY_MS);
    mockAnalyses.delete(id);
    return;
  }

  await request(`${API_BASE}/history/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new HistoryError(
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw await toHistoryError(response);
  }

  return response;
}

async function toHistoryError(response: Response): Promise<HistoryError> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error body: fall back to the status code below.
  }

  if (isApiError(payload)) {
    return new HistoryError(payload.error.code, payload.error.message);
  }

  if (response.status === 404) {
    return new HistoryError(
      "NOT_FOUND",
      "We couldn't find that analysis. It may have been deleted.",
    );
  }

  return new HistoryError(
    "REQUEST_FAILED",
    `Request failed (HTTP ${response.status}). Please try again.`,
  );
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { error } = value as { error?: unknown };
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === "string" && typeof message === "string";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
