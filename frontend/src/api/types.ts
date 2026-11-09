export type Top3Item = {
  label: string;
  score: number;
};

export type Recipe = {
  ingredients: string[];
  steps: string[];
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
  created_at: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
