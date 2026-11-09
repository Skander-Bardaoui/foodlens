const API_BASE = import.meta.env.VITE_API_URL || "/api";

function originOf(value: string): string {
  if (!/^https?:\/\//i.test(value)) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

const ASSET_BASE = (import.meta.env.VITE_ASSET_URL || originOf(API_BASE)).replace(/\/$/, "");

export function resolveAssetUrl(value: string): string {
  if (!value || !ASSET_BASE) return value;
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }
  return `${ASSET_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}
