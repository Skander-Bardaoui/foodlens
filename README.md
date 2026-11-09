# FoodLens

FoodLens identifies a dish from a food photo, shows the model's top-3 predictions, and generates a cooking recipe with an LLM. Confident predictions get a full recipe; ambiguous photos get a friendly "we're not sure" screen instead of a hallucinated recipe.

## What is implemented

- Photo upload with JPEG/PNG validation and a 5 MB limit.
- Food-101 image classification with a Hugging Face ViT model running on CPU.
- Top-3 predictions and a confidence score.
- Uncertainty handling: below 40% confidence the API skips the LLM and returns no recipe.
- AI recipe generation through any OpenAI-compatible chat-completions endpoint.
- PostgreSQL persistence through SQLAlchemy and Alembic.
- Result page with prediction bars, checkable ingredients, numbered steps and delete confirmation.
- History endpoints: list, read and delete analyses.
- Uploaded images served back to the frontend from `/uploads`.
- Frontend mock mode for UI work without the API.

## Stack

| Layer    | Technology                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------- |
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3, React Router, TanStack Query, react-dropzone        |
| Backend  | FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, psycopg 3, Pillow, httpx                              |
| ML       | transformers + PyTorch (CPU wheel), `nateraw/food` Food-101 classifier                            |
| LLM      | OpenAI-compatible chat completions API (OpenAI by default, configurable base URL)                 |
| Database | PostgreSQL 16                                                                                     |
| Runtime  | Docker Compose (`db`, `api`, `web`)                                                               |

## Architecture

```text
                        Browser (React + Vite)
                     http://localhost:5173
                             |
              /api/*  and  /uploads/*  (Vite proxy)
                             |
                             v
                  FastAPI  http://api:8000
                 /api/analyze   /api/history
                             |
        +--------------------+---------------------+
        |                    |                     |
        v                    v                     v
  Pillow validation     Food-101 ViT          SQLAlchemy 2
  (JPEG/PNG, <=5MB)     (CPU, in-process)     + psycopg 3
                             |                     |
                             | top-3 + score       v
                             |               PostgreSQL 16
                             v               (analyses table)
                   confidence < 0.40 ?
                    /             \
                  yes              no
                  /                 \
        uncertain response     Recipe prompt
        (no recipe)                 |
                                    v
                         OpenAI-compatible LLM
                         (JSON ingredients + steps)
                                    |
                                    v
                     save row + image, return AnalysisOut

  Uploaded files: backend/uploads/  ->  served at /uploads/<uuid>.<ext>
```

Request flow:

1. The browser posts a multipart image to `POST /api/analyze`.
2. The API validates size and format, runs the classifier, and keeps the top 3 labels.
3. If the top score is at least 0.40, it asks the LLM for a JSON recipe with 6-12 quantified ingredients and 4-8 steps.
4. The analysis row is saved in PostgreSQL; the image is saved under `backend/uploads`.
5. The browser loads the result from `GET /api/history/{id}` and displays the image from `/uploads`.

## Quick start (under 10 minutes)

### Prerequisites

- Docker Desktop (Compose v2) with at least 4 GB of free disk space.
- An API key for an OpenAI-compatible LLM, or a local OpenAI-compatible server.
- Two food photos for a manual test (JPG or PNG, under 5 MB each).

### Steps

```bash
git clone https://github.com/Skander-Bardaoui/foodlens.git
cd foodlens
cp .env.example .env
```

Open `.env` and set one of:

```dotenv
# OpenAI
LLM_API_KEY=sk-...

# or any OpenAI-compatible endpoint
LLM_BASE_URL=http://host.docker.internal:11434/v1
LLM_API_KEY=local
LLM_MODEL=your-model
```

Start the stack:

```bash
docker compose up --build
```

Then open:

| Service   | URL                            |
| --------- | ------------------------------ |
| App       | http://localhost:5173          |
| API docs  | http://localhost:8000/docs     |
| Health    | http://localhost:8000/api/health |

Expected timing on a normal connection:

| Step                                  | Time        |
| ------------------------------------- | ----------- |
| Image build (first time)              | 2-4 minutes |
| Containers start, migrations run      | under 30 s  |
| First analysis (model download/cache) | 1-3 minutes |
| Later analyses                        | 1-3 seconds |

The API container waits for PostgreSQL, runs `alembic upgrade head`, then loads the classifier. The model is cached in the `foodlens_hf_cache` volume, so it is downloaded once.

If ports 5173 or 8000 are already in use, set `WEB_PORT` and `API_PORT` in `.env` and use those ports instead.

To stop:

```bash
docker compose down        # keep data
docker compose down -v     # also delete PostgreSQL and model caches
```

## Configuration

| Variable         | Default                                                     | Purpose                                              |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | `postgresql+psycopg://foodlens:foodlens@db:5432/foodlens`   | SQLAlchemy URL used by the API and Alembic           |
| `HF_MODEL_ID`    | `nateraw/food`                                              | Hugging Face Food-101 classifier                     |
| `LLM_PROVIDER`   | `openai`                                                    | Provider name; `openai` is built in                  |
| `LLM_API_KEY`    | empty                                                       | Required for recipe generation                       |
| `LLM_MODEL`      | `gpt-4o-mini`                                               | Model name sent to the LLM                           |
| `LLM_BASE_URL`   | empty                                                       | Override for a local or self-hosted OpenAI API       |
| `MAX_UPLOAD_MB`  | `5`                                                         | Server-side upload limit; keep in sync with the UI   |
| `UPLOAD_DIR`     | `uploads`                                                   | Image storage directory inside the API container     |
| `CORS_ORIGINS`   | `http://localhost:5173`                                     | Comma-separated allowed browser origins              |
| `API_PORT`       | `8000`                                                      | Host port mapped to the API container                |
| `WEB_PORT`       | `5173`                                                      | Host port mapped to the Vite dev server              |
| `VITE_USE_MOCK`  | `false`                                                     | `true` serves frontend mock data instead of the API  |

## API

| Method   | Path                       | Description                                      |
| -------- | -------------------------- | ------------------------------------------------ |
| `GET`    | `/api/health`              | Health check                                     |
| `POST`   | `/api/analyze`             | Multipart image upload; returns the analysis     |
| `GET`    | `/api/history?limit=20`    | Recent analyses, newest first                    |
| `GET`    | `/api/history/{id}`        | One analysis                                     |
| `DELETE` | `/api/history/{id}`        | Delete an analysis                               |
| `GET`    | `/uploads/{filename}`      | Stored image                                     |

Errors use the envelope `{"error": {"code": "...", "message": "..."}}`. `POST /api/analyze` returns 400 for invalid images, 413 for files over the limit, and 502 when recipe generation fails.

## Tests

Backend tests use an in-memory SQLite database and mocked classifier/LLM responses:

```bash
docker compose exec api pytest
```

Frontend:

```bash
cd frontend
npm run build
```

Frontend mock mode, useful when the API or LLM is not available:

```bash
cd frontend
VITE_USE_MOCK=true npm run dev
```

## Project structure

```text
foodlens/
  docker-compose.yml
  .env.example
  README.md
  DEMO.md
  design/                         # Stitch design exports
  backend/
    Dockerfile
    requirements.txt
    alembic/
      versions/20261109_0001_create_analyses.py
    app/
      main.py                     # FastAPI app, lifespan, /uploads mount
      core/config.py              # environment settings
      api/analyze.py              # POST /api/analyze
      api/history.py              # GET/DELETE history, GET list
      db/models.py                # Analysis table
      db/repository.py            # create/get/list/delete
      db/session.py               # engine, SessionLocal, get_db
      ml/classifier.py            # Food-101 ViT wrapper
      ml/image_utils.py           # validation and size checks
      ml/recipe.py                # LLM client and recipe parsing
      schemas.py                  # Pydantic response models
    tests/
    uploads/                      # stored images (gitignored)
  frontend/
    Dockerfile
    vite.config.ts                # proxies /api and /uploads
    src/
      api/analyze.ts              # upload client + mock mode
      api/history.ts              # history client
      pages/UploadPage.tsx
      pages/ResultPage.tsx
      components/AnalyzingView.tsx
```

## Known limitations

- **Only 101 dish types.** The classifier is Food-101, so it can only return one of 101 labels. A non-food photo still gets the closest food label; the app mitigates this by treating scores below 40% as uncertain and skipping the recipe.
- **LLM recipes may be inaccurate.** Ingredients, quantities and cooking times are generated text, not verified culinary data. Always review them before cooking.
- Single-user local app: no authentication, accounts, rate limiting or per-user history.
- Uploaded images are stored on local disk and are not cleaned up automatically. Deleting an analysis removes its database row but not the image file.
- The History page UI is still a placeholder; the history API is implemented.
- JPEG and PNG only, maximum 5 MB. Large high-resolution phone photos may need resizing.
- CPU-only inference. The first request downloads the model; later requests are faster but still slower than GPU inference.
- The LLM is required for confident predictions. Without `LLM_API_KEY` (or a reachable `LLM_BASE_URL`), analyses return `502 LLM_FAILURE`.

## Demo

See [DEMO.md](DEMO.md) for a 2-minute walkthrough with the order of screens.
