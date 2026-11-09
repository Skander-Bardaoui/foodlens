const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const MOCK_MODE = import.meta.env.VITE_USE_MOCK === "true";

export type HealthResponse = {
  status: string;
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchHealth(): Promise<HealthResponse> {
  if (MOCK_MODE) {
    return Promise.resolve({ status: "ok" });
  }
  return apiGet<HealthResponse>("/health");
}
