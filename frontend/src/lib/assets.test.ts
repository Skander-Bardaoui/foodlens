import { afterEach, describe, expect, it, vi } from "vitest";

async function loadAssets(apiUrl: string, assetUrl: string) {
  vi.stubEnv("VITE_API_URL", apiUrl);
  vi.stubEnv("VITE_ASSET_URL", assetUrl);
  vi.resetModules();
  return import("./assets");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("resolveAssetUrl", () => {
  it("falls back to the API origin when VITE_ASSET_URL is empty", async () => {
    const { resolveAssetUrl } = await loadAssets("http://localhost:18000/api", "");
    expect(resolveAssetUrl("/uploads/photo.jpg")).toBe(
      "http://localhost:18000/uploads/photo.jpg",
    );
  });

  it("prefixes relative paths with a configured asset origin", async () => {
    const { resolveAssetUrl } = await loadAssets(
      "/api",
      "https://cdn.example.com/",
    );
    expect(resolveAssetUrl("uploads/photo.jpg")).toBe(
      "https://cdn.example.com/uploads/photo.jpg",
    );
  });

  it("leaves absolute and data URLs untouched", async () => {
    const { resolveAssetUrl } = await loadAssets("https://api.example.com/api", "");
    expect(resolveAssetUrl("https://images.example.com/photo.jpg")).toBe(
      "https://images.example.com/photo.jpg",
    );
    expect(resolveAssetUrl("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc",
    );
  });

  it("keeps relative paths when no absolute origin is available", async () => {
    const { resolveAssetUrl } = await loadAssets("/api", "");
    expect(resolveAssetUrl("/uploads/photo.jpg")).toBe("/uploads/photo.jpg");
  });
});
