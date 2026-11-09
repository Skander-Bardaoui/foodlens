# FoodLens - 2-minute demo script

## Before you start

- `docker compose up --build` is running and the "API online" badge is green.
- `LLM_API_KEY` (Groq by default) or `LLM_BASE_URL` is configured, otherwise confident photos return `502`.
- Two photos are ready on the desktop:
  - a clearly recognizable dish (pizza, sushi, burger, salad, pasta);
  - a photo that will be ambiguous: a tight crop, a dark shot, or a non-food image.
- Browser at http://localhost:5173, window about 1440 px wide.

## Screen order and narration

### 0:00-0:10 - Home / upload

Screen: hero "Snap a dish. Get the recipe.", upload dropzone, three pipeline cards.

Say: "FoodLens turns one food photo into a dish prediction and a full recipe. Upload is validated for JPG/PNG up to 5 MB."

### 0:10-0:20 - Staged preview

Action: drop the clear food photo. Pause on the preview and file size.

Say: "The image is staged locally before anything is sent. I can remove or replace it."

### 0:20-0:32 - Analyzing state

Action: click **Analyze this dish**.

Screen: uploaded photo on the left with the scan animation; Culinary Pipeline on the right showing Recognizing the dish -> Finding ingredients -> Writing the recipe, plus a recipe skeleton and a disabled Analyzing button.

Say: "While the request runs, the UI shows the three real analysis stages: vision, ingredient mapping and recipe generation."

### 0:32-1:00 - Confident result

Screen: `/result/:id` with the photo, dish name, confidence badge and Top 3 predictions on the left; ingredients and numbered steps on the right.

Say: "This is a 99% match for Pizza. The left side explains the model output with top-3 probabilities. The right side is the generated recipe."

### 1:00-1:12 - Result interactions

Action: check two ingredients (counter updates, text gets a line-through). Scroll through the steps.

Say: "Ingredients are checkable while cooking, and the recipe stays readable on mobile because the layout stacks."

### 1:12-1:32 - Low-confidence variant

Action: click **Analyze another photo**, upload the ambiguous or non-food photo.

Screen: amber banner "We're not sure about this dish. Is it one of these?", top-3 chips with scores, "Try another photo" button, "No recipe for this photo yet".

Say: "Below 40% confidence FoodLens refuses to invent a recipe. It surfaces the top candidates and asks for a better photo instead."

### 1:32-1:45 - Delete flow

Action: on the confident result, click **Delete**, show the confirmation dialog, confirm. You land back on the home page.

Say: "Analyses are persisted in PostgreSQL. Delete asks for confirmation and removes the record through the history API."

### 1:45-2:00 - Proof and close

Action: open http://localhost:8000/docs in a second tab briefly, or show the green "API online" badge.

Say: "The API is FastAPI with OpenAPI docs, the model is a Food-101 ViT on CPU, and data lives in PostgreSQL. Known limits: 101 dish classes and AI-written recipes that should be reviewed."

## If something goes wrong

- **502 on a confident photo:** LLM key is missing or unreachable. Check `docker compose logs api` and `.env`.
- **First analysis is slow:** the Food-101 model is downloading; later runs use the cached volume.
- **Upload rejected:** the file must be JPG/PNG and under 5 MB.
- **Port already in use:** set `WEB_PORT` / `API_PORT` in `.env` and restart Compose.
