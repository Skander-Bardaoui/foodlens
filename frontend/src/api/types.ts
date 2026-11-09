export type Top3Item = {
  label: string;
  score: number;
};

export type Analysis = {
  id: string;
  label: string;
  confidence: number;
  uncertain: boolean;
  top3: Top3Item[];
  ingredients: string[];
  steps: string[];
  image_url: string;
  created_at: string; // ISO 8601
};

export type AnalysisList = {
  items: Analysis[];
  total: number;
};

export type HistorySort = "newest" | "confidence";

export type HistoryParams = {
  limit?: number;
  offset?: number;
  sort?: HistorySort;
};

export type ApiError = {
  code: string;
  message: string;
};
