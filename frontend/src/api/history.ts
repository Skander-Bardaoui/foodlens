import { ApiErrorException, http } from "./http";
import type { Analysis, AnalysisList, HistoryParams } from "./types";

export const HISTORY_MOCK_MODE = import.meta.env.VITE_USE_MOCK === "true";

const DEFAULT_LIMIT = 20;

function buildHistoryQuery({ limit = DEFAULT_LIMIT, offset = 0, sort = "newest" }: HistoryParams): string {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort,
  });
  return `/history?${params.toString()}`;
}

export function getHistory(params: HistoryParams = {}): Promise<AnalysisList> {
  if (HISTORY_MOCK_MODE) {
    return mockGetHistory(params);
  }
  return http.get<AnalysisList>(buildHistoryQuery(params));
}

export function getAnalysis(id: string): Promise<Analysis> {
  if (HISTORY_MOCK_MODE) {
    return mockGetAnalysis(id);
  }
  return http.get<Analysis>(`/history/${encodeURIComponent(id)}`);
}

export function deleteAnalysis(id: string): Promise<void> {
  if (HISTORY_MOCK_MODE) {
    return mockDeleteAnalysis(id);
  }
  return http.delete<void>(`/history/${encodeURIComponent(id)}`);
}

type MockDish = {
  label: string;
  emoji: string;
  confidence: number;
  daysAgo: number;
  hoursAgo: number;
  alternatives: [string, string];
  ingredients: string[];
  steps: string[];
  gradient: [string, string];
};

const MOCK_DISHES: MockDish[] = [
  {
    label: "Margherita Pizza",
    emoji: "🍕",
    confidence: 0.97,
    daysAgo: 0,
    hoursAgo: 2,
    alternatives: ["Marinara Pizza", "Focaccia"],
    ingredients: ["pizza dough", "San Marzano tomatoes", "fresh mozzarella", "basil", "olive oil"],
    steps: [
      "Stretch the dough on a floured surface",
      "Spread crushed tomatoes and add mozzarella",
      "Bake at 250C for 8-10 minutes",
      "Finish with basil and olive oil",
    ],
    gradient: ["#8e2a20", "#e07a3f"],
  },
  {
    label: "Sushi Platter",
    emoji: "🍣",
    confidence: 0.94,
    daysAgo: 3,
    hoursAgo: 5,
    alternatives: ["Sashimi Platter", "Onigiri"],
    ingredients: ["sushi rice", "nori", "salmon", "tuna", "avocado", "wasabi"],
    steps: [
      "Season the rice with vinegar and sugar",
      "Slice the fish into thin pieces",
      "Shape the rice and wrap with nori",
      "Arrange on a platter with wasabi",
    ],
    gradient: ["#145c4c", "#2f9c7e"],
  },
  {
    label: "Cheeseburger",
    emoji: "🍔",
    confidence: 0.92,
    daysAgo: 6,
    hoursAgo: 1,
    alternatives: ["Bacon Burger", "Veggie Burger"],
    ingredients: ["brioche bun", "beef patty", "cheddar", "pickles", "lettuce", "tomato", "burger sauce"],
    steps: [
      "Season and grill the patty 3 minutes per side",
      "Melt cheddar on the patty",
      "Toast the bun and spread sauce",
      "Layer lettuce, tomato, pickles and the patty",
    ],
    gradient: ["#5d4128", "#c68b4d"],
  },
  {
    label: "Tonkotsu Ramen",
    emoji: "🍜",
    confidence: 0.89,
    daysAgo: 9,
    hoursAgo: 7,
    alternatives: ["Shoyu Ramen", "Miso Ramen"],
    ingredients: ["ramen noodles", "pork bone broth", "chashu pork", "soft-boiled egg", "scallions", "nori"],
    steps: [
      "Simmer pork bones for 12 hours",
      "Cook the noodles until just tender",
      "Arrange chashu, egg and scallions in the bowl",
      "Pour the hot broth over the noodles",
    ],
    gradient: ["#7a3418", "#d9822b"],
  },
  {
    label: "Beef Tacos",
    emoji: "🌮",
    confidence: 0.86,
    daysAgo: 13,
    hoursAgo: 3,
    alternatives: ["Chicken Tacos", "Quesadilla"],
    ingredients: ["corn tortillas", "ground beef", "onion", "cilantro", "lime", "salsa"],
    steps: [
      "Brown the beef with taco spices",
      "Warm the tortillas on a dry pan",
      "Fill with beef, onion and cilantro",
      "Serve with lime and salsa",
    ],
    gradient: ["#9a3d08", "#efa23c"],
  },
  {
    label: "Seafood Paella",
    emoji: "🥘",
    confidence: 0.83,
    daysAgo: 17,
    hoursAgo: 6,
    alternatives: ["Chicken Paella", "Risotto"],
    ingredients: ["bomba rice", "shrimp", "mussels", "saffron", "peas", "fish broth"],
    steps: [
      "Sauté the seafood and set aside",
      "Toast the rice with saffron and broth",
      "Simmer without stirring for 18 minutes",
      "Return the seafood and rest for 5 minutes",
    ],
    gradient: ["#8a6000", "#d9a520"],
  },
  {
    label: "Pad Thai",
    emoji: "🍝",
    confidence: 0.79,
    daysAgo: 22,
    hoursAgo: 9,
    alternatives: ["Pad See Ew", "Drunken Noodles"],
    ingredients: ["rice noodles", "tamarind sauce", "fish sauce", "egg", "shrimp", "peanuts", "lime"],
    steps: [
      "Soak the noodles until pliable",
      "Stir-fry shrimp and egg in a hot wok",
      "Add noodles, tamarind and fish sauce",
      "Top with peanuts and a lime wedge",
    ],
    gradient: ["#8f5200", "#e0a13e"],
  },
  {
    label: "Beef Lasagna",
    emoji: "🍲",
    confidence: 0.75,
    daysAgo: 28,
    hoursAgo: 4,
    alternatives: ["Vegetable Lasagna", "Cannelloni"],
    ingredients: ["lasagna sheets", "beef ragù", "béchamel sauce", "parmesan", "mozzarella"],
    steps: [
      "Simmer the ragù for an hour",
      "Layer pasta, ragù and béchamel",
      "Top with parmesan and mozzarella",
      "Bake at 190C for 35 minutes",
    ],
    gradient: ["#7d2424", "#d26a5c"],
  },
  {
    label: "Mushroom Omelette",
    emoji: "🍳",
    confidence: 0.68,
    daysAgo: 7,
    hoursAgo: 8,
    alternatives: ["Cheese Omelette", "Scrambled Eggs"],
    ingredients: ["eggs", "mushrooms", "butter", "chives", "salt"],
    steps: [
      "Sauté the mushrooms in butter",
      "Whisk the eggs with salt",
      "Cook the eggs and fold over the mushrooms",
      "Garnish with chives",
    ],
    gradient: ["#927000", "#e5c348"],
  },
  {
    label: "Chicken Tikka Masala",
    emoji: "🍛",
    confidence: 0.58,
    daysAgo: 41,
    hoursAgo: 2,
    alternatives: ["Butter Chicken", "Chicken Korma"],
    ingredients: [],
    steps: [],
    gradient: ["#8f2f24", "#df7a5e"],
  },
  {
    label: "Tiramisu",
    emoji: "🍰",
    confidence: 0.46,
    daysAgo: 49,
    hoursAgo: 5,
    alternatives: ["Panna Cotta", "Cheesecake"],
    ingredients: [],
    steps: [],
    gradient: ["#4d3223", "#a97a58"],
  },
  {
    label: "Poke Bowl",
    emoji: "🥗",
    confidence: 0.35,
    daysAgo: 57,
    hoursAgo: 11,
    alternatives: ["Buddha Bowl", "Sashimi Salad"],
    ingredients: [],
    steps: [],
    gradient: ["#14532d", "#4fbf7a"],
  },
];

const MOCK_NOW = Date.now();

function mockImageUrl({ emoji, gradient: [from, to] }: MockDish): string {
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 480'>",
    "<defs>",
    `<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>`,
    `<stop offset='0' stop-color='${from}'/>`,
    `<stop offset='1' stop-color='${to}'/>`,
    "</linearGradient>",
    "</defs>",
    "<rect width='640' height='480' fill='url(#bg)'/>",
    "<circle cx='320' cy='250' r='168' fill='rgba(255,255,255,0.10)'/>",
    "<circle cx='320' cy='250' r='132' fill='rgba(255,255,255,0.16)'/>",
    `<text x='320' y='297' font-size='132' text-anchor='middle' font-family='Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif'>${emoji}</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildMockAnalyses(): Analysis[] {
  return MOCK_DISHES.map((dish) => {
    const createdAt = new Date(MOCK_NOW - dish.daysAgo * 86_400_000 - dish.hoursAgo * 3_600_000);
    const gap = 1 - dish.confidence;

    return {
      id: crypto.randomUUID(),
      label: dish.label,
      confidence: dish.confidence,
      uncertain: dish.confidence < 0.6,
      top3: [
        { label: dish.label, score: dish.confidence },
        { label: dish.alternatives[0], score: Number((gap * 0.5).toFixed(3)) },
        { label: dish.alternatives[1], score: Number((gap * 0.25).toFixed(3)) },
      ],
      ingredients: dish.confidence < 0.6 ? [] : [...dish.ingredients],
      steps: dish.confidence < 0.6 ? [] : [...dish.steps],
      image_url: mockImageUrl(dish),
      created_at: createdAt.toISOString(),
    };
  });
}

let mockAnalyses: Analysis[] | null = null;

function mockStore(): Analysis[] {
  mockAnalyses ??= buildMockAnalyses();
  return mockAnalyses;
}

function mockDelay(): Promise<void> {
  const ms = 280 + Math.round(Math.random() * 220);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockGetHistory({
  limit = DEFAULT_LIMIT,
  offset = 0,
  sort = "newest",
}: HistoryParams): Promise<AnalysisList> {
  await mockDelay();

  const sorted = [...mockStore()].sort((a, b) =>
    sort === "confidence"
      ? b.confidence - a.confidence
      : Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
  };
}

async function mockGetAnalysis(id: string): Promise<Analysis> {
  await mockDelay();

  const analysis = mockStore().find((item) => item.id === id);
  if (!analysis) {
    throw new ApiErrorException({ code: "NOT_FOUND", message: "Analysis not found" });
  }
  return analysis;
}

async function mockDeleteAnalysis(id: string): Promise<void> {
  await mockDelay();

  const store = mockStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new ApiErrorException({ code: "NOT_FOUND", message: "Analysis not found" });
  }
  store.splice(index, 1);
}
