import type { ApiError } from "./types";

const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiErrorException extends Error implements ApiError {
  readonly code: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiErrorException";
    this.code = error.code;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as { error?: Partial<ApiError> };
    if (data.error && typeof data.error.code === "string" && typeof data.error.message === "string") {
      return { code: data.error.code, message: data.error.message };
    }
  } catch {
    // Non-JSON error response, e.g. from a proxy or gateway.
  }

  return {
    code: `HTTP_${response.status}`,
    message: response.statusText || `Request failed with status ${response.status}`,
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;

  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  if (!response.ok) {
    throw new ApiErrorException(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

function del<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

export const http = { get, post, delete: del };
