import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteAnalysis, getHistory } from "../api/history";
import type { Analysis, HistoryParams } from "../api/types";
import { showToast } from "../lib/toast";
import HistoryPage from "./HistoryPage";

vi.mock("../api/history", () => ({
  getHistory: vi.fn(),
  deleteAnalysis: vi.fn(),
}));

vi.mock("../lib/toast", () => ({
  showToast: vi.fn(),
}));

const getHistoryMock = vi.mocked(getHistory);
const deleteAnalysisMock = vi.mocked(deleteAnalysis);
const showToastMock = vi.mocked(showToast);

const analyses: Analysis[] = [
  {
    id: "1",
    label: "Margherita pizza",
    confidence: 0.97,
    uncertain: false,
    top3: [
      { label: "Margherita pizza", score: 0.97 },
      { label: "Focaccia", score: 0.02 },
      { label: "Bruschetta", score: 0.01 },
    ],
    ingredients: ["dough", "tomato", "mozzarella"],
    steps: ["Bake"],
    image_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    created_at: "2026-11-09T12:00:00.000Z",
  },
  {
    id: "2",
    label: "Sushi Platter",
    confidence: 0.94,
    uncertain: false,
    top3: [
      { label: "Sushi Platter", score: 0.94 },
      { label: "Sashimi", score: 0.04 },
      { label: "Onigiri", score: 0.02 },
    ],
    ingredients: ["rice", "salmon", "nori"],
    steps: ["Roll"],
    image_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    created_at: "2026-11-08T12:00:00.000Z",
  },
  {
    id: "3",
    label: "Tonkotsu ramen",
    confidence: 0.89,
    uncertain: false,
    top3: [
      { label: "Tonkotsu ramen", score: 0.89 },
      { label: "Shoyu ramen", score: 0.07 },
      { label: "Miso ramen", score: 0.04 },
    ],
    ingredients: ["noodles", "broth", "egg"],
    steps: ["Simmer"],
    image_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    created_at: "2026-11-07T12:00:00.000Z",
  },
];

let store: Analysis[];

function renderHistory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  store = analyses.map((analysis) => ({ ...analysis }));
  showToastMock.mockReset();

  getHistoryMock.mockReset();
  getHistoryMock.mockImplementation(async (params: HistoryParams = {}) => {
    const sorted = [...store].sort((a, b) =>
      params.sort === "confidence"
        ? b.confidence - a.confidence
        : Date.parse(b.created_at) - Date.parse(a.created_at),
    );
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 20;

    return { items: sorted.slice(offset, offset + limit), total: sorted.length };
  });

  deleteAnalysisMock.mockReset();
  deleteAnalysisMock.mockResolvedValue(undefined);
});

describe("HistoryPage", () => {
  it("filters the loaded analyses by dish name", async () => {
    const user = userEvent.setup();
    renderHistory();

    expect(await screen.findByText("Margherita pizza")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Search analyses by dish name" }),
      "sushi",
    );

    await waitFor(
      () => expect(screen.queryByText("Margherita pizza")).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.getByText("Sushi Platter")).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 3 total dish scans/)).toBeInTheDocument();
  });

  it("requests the selected sort order", async () => {
    const user = userEvent.setup();
    renderHistory();

    await screen.findByText("Margherita pizza");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort analyses" }),
      "confidence",
    );

    await waitFor(() =>
      expect(
        getHistoryMock.mock.calls.some(([params]) => params?.sort === "confidence"),
      ).toBe(true),
    );
  });

  it("deletes an analysis after confirmation", async () => {
    const user = userEvent.setup();
    renderHistory();

    await screen.findByText("Sushi Platter");

    await user.click(screen.getByRole("button", { name: "Delete Sushi Platter" }));

    const dialog = screen.getByRole("dialog", { name: "Delete this analysis?" });
    store = store.filter((analysis) => analysis.id !== "2");
    await user.click(within(dialog).getByRole("button", { name: "Delete analysis" }));

    await waitFor(() =>
      expect(deleteAnalysisMock.mock.calls[0]?.[0]).toBe("2"),
    );
    await waitFor(() => expect(screen.queryByText("Sushi Platter")).not.toBeInTheDocument());
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Analysis deleted" }),
    );
  });

  it("rolls back the optimistic removal when deletion fails", async () => {
    const user = userEvent.setup();
    let rejectDelete: (error: Error) => void = () => {};
    deleteAnalysisMock.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    renderHistory();

    await screen.findByText("Sushi Platter");

    await user.click(screen.getByRole("button", { name: "Delete Sushi Platter" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete analysis" }),
    );

    await waitFor(() => expect(screen.queryByText("Sushi Platter")).not.toBeInTheDocument());

    rejectDelete(new Error("Network down"));

    expect(await screen.findByText("Sushi Platter")).toBeInTheDocument();
    expect(showToastMock).not.toHaveBeenCalled();
  });
});
