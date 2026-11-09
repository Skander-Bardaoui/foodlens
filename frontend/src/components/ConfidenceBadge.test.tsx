import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConfidenceBadge } from "./Badge";

function toneFor(label: string): string | null {
  return screen.getByText(label).closest("[data-tone]")?.getAttribute("data-tone") ?? null;
}

describe("ConfidenceBadge", () => {
  it.each([
    [1, "success"],
    [0.75, "success"],
    [0.749, "warning"],
    [0.4, "warning"],
    [0.399, "danger"],
    [0, "danger"],
  ])("maps %s to the %s tone", (value, expectedTone) => {
    render(<ConfidenceBadge value={value} />);

    expect(toneFor(`${Math.round(value * 100)}% match`)).toBe(expectedTone);
  });

  it("rounds the percentage for display", () => {
    render(<ConfidenceBadge value={0.749} />);
    expect(screen.getByText("75% match")).toBeInTheDocument();
  });

  it("accepts a custom label", () => {
    render(<ConfidenceBadge value={0.2} label="Very unsure" />);
    expect(screen.getByText("Very unsure")).toBeInTheDocument();
  });
});
