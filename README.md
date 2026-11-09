# FoodLens

FoodLens identifies a dish from a food photo, shows the model's top-3 predictions, and generates a cooking recipe with an LLM. Confident predictions get a full recipe; ambiguous photos get a friendly "we're not sure" screen instead of a hallucinated recipe.

## What is implemented

- Photo upload with JPEG/PNG validation and a 5 MB limit.
- Food-101 image classification with a Hugging Face ViT model running on CPU.
- Top-3 predictions and a confidence score.
- Uncertainty handling: below 40% confidence the API skips the LLM and returns no recipe.
- AI recipe generation through Groq, or any OpenAI-compatible chat-completions endpoint.
- PostgreSQL persistence through SQLAlchemy and Alembic.
- Result page with prediction bars, checkable ingredients, numbered steps and delete confirmation.
- History page with search, sort, infinite scrolling and delete confirmation.
- History API with pagination (`limit`, `offset`) and sorting (`newest`, `confidence`).
- Structured JSON request logs with `X-Request-ID`, generic 500 responses and stack traces in server logs.
- Request-body and per-IP analyze rate limiting with standard 413/429 error envelopes.
- Production Docker image and Compose stack with non-root Gunicorn workers, migrations, persistent uploads and a pre-downloaded model cache.
- Uploaded images served back to the frontend from `/uploads` and removed with their analysis.
- Shared design-system components, a styleguide page and frontend mock mode for UI work without the API.
- Responsive UI checked at 390, 768 and 1440 px, with labelled controls, visible focus states, keyboard-trapped dialogs, meaningful image alt text and reduced-motion support.
- Vitest + React Testing Library tests for confidence thresholds, dialogs, the History page and the error boundary, plus Playwright flows for history and upload-to-result.
- Production frontend image: Node build, nginx, SPA fallback, gzip, immutable asset caching and no styleguide route in production.

## Stack

| Layer    | Technology                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------- |
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3, React Router, TanStack Query, react-dropzone        |
| Backend  | FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, psycopg 3, Pillow, httpx                              |
| ML       | transformers + PyTorch (CPU wheel), `nateraw/food` Food-101 classifier                            |
| LLM      | Groq chat completions by default (OpenAI-compatible, configurable base URL)                       |
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
                         Groq chat completions
                         (OpenAI-compatible, JSON output)
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
- A Groq API key (default), or another OpenAI-compatible LLM endpoint.
- Two food photos for a manual test (JPG or PNG, under 5 MB each).

### Steps

```bash
git clone https://github.com/Skander-Bardaoui/foodlens.git
cd foodlens
cp .env.example .env
```

Open `.env` and set one of:

```dotenv
# Groq (default)
LLM_API_KEY=gsk_...

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

## Frontend

The React single-page app has three main screens plus a development-only styleguide.

| Upload | History | Result |
| --- | --- | --- |
| ![Upload page](docs/screenshots/upload.png) | ![History page](docs/screenshots/history.png) | ![Result page](docs/screenshots/result.png) |

### Run locally

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` and `/uploads` to `http://localhost:8000` by default. Override the proxy target with `VITE_PROXY_TARGET`.

To work on the UI without the API or an LLM key, use the in-memory demo data:

```bash
VITE_USE_MOCK=true npm run dev
```

Mock mode serves twelve seeded analyses, alternates confident and uncertain analyses, and keeps uploads and deletes in memory for the current tab.

### Structure and components

```text
frontend/
  Dockerfile                  # multi-stage Node build + nginx runtime
  nginx.conf                  # SPA fallback, gzip, cache and security headers
  playwright.config.ts
  vitest.config.ts
  e2e/                        # Playwright flows and API mocks
  scripts/                    # README screenshot capture
  src/
    api/                      # analyze, history and fetch client
    components/               # shared UI components
    layouts/MainLayout.tsx
    lib/                      # toast store, class helper, asset URL resolver
    pages/                    # Upload, Result, History, NotFound, Styleguide (dev only)
    test/setup.ts
```

| Group | Components |
| --- | --- |
| Layout | `MainLayout`, `Navbar`, `Footer` |
| Inputs and actions | `Button`, `IconButton`, `DropZone` |
| Predictions and recipes | `ConfidenceBadge`, `Badge`, `HistoryCard`, `IngredientsList`, `StepsList`, `ProgressBars`, `ProgressSteps`, `StepCard` |
| Feedback | `AnalyzingView`, `Toast`, `ErrorBoundary`, `ErrorState`, `EmptyState`, `SkeletonCard` |
| Structure | `Card`, `Chip`, `SectionTitle`, `ConfirmDialog` |

`ConfirmDialog` traps keyboard focus, restores it when closed, closes on Escape or backdrop click and exposes `aria-modal`, `aria-labelledby`, `aria-describedby` and an alert region for errors. The dropzones are keyboard-activatable buttons with labelled file inputs, and every page has a single `h1` hierarchy.

### Tests

```bash
cd frontend
npm test                    # Vitest + React Testing Library
npm run test:watch
npm run lint                # ESLint
npx playwright install chromium
npm run test:e2e            # Playwright, Chromium (network-mocked)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 REAL_API_ORIGIN=http://127.0.0.1:8000 REAL_STACK=1 npm run test:e2e -- e2e/real-stack.spec.ts
npm run screenshots         # regenerate docs/screenshots (needs npm run dev)
```

The real-stack spec is skipped by default. Point it at a running Compose app and set
`REAL_STACK=1` to exercise the classifier, LLM, PostgreSQL and uploads folder end to end.

The unit suite covers `ConfidenceBadge` boundary values (0.40 and 0.75), `ConfirmDialog` focus and dismissal behavior, History filtering, sorting, optimistic deletion and rollback, and the `ErrorBoundary` fallback. The Playwright suite covers seeded History search/delete, upload-to-result, and overflow checks at 390, 768 and 1440 px.

### Production build

```bash
npm run build
```

`tsc` runs before Vite, and the `/styleguide` route and page are excluded from production output because the route is imported lazily only under `import.meta.env.DEV`.

Build and run the container:

```bash
docker build -t foodlens-web --build-arg VITE_API_URL=https://api.example.com/api ./frontend
docker run --rm -p 8080:80 foodlens-web
```

`VITE_API_URL` is baked in at build time. It must be reachable from the browser, and the API's `CORS_ORIGINS` must include the frontend origin. Relative `/uploads` URLs returned by the API are resolved against the API origin automatically; set `VITE_ASSET_URL` only when images are served from a separate CDN.

The nginx image serves the SPA with `try_files` fallback, gzip, one-year immutable caching for `/assets/*`, no caching for `index.html`, security headers and a `/healthz` endpoint.

## Configuration

| Variable         | Default                                                     | Purpose                                              |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | `postgresql+psycopg://foodlens:foodlens@db:5432/foodlens`   | SQLAlchemy URL used by the API and Alembic           |
| `HF_MODEL_ID`    | `nateraw/food`                                              | Hugging Face Food-101 classifier                     |
| `LLM_PROVIDER`   | `groq`                                                      | Provider name; `groq` and `openai` are built in      |
| `LLM_API_KEY`    | empty                                                       | Required for recipe generation                       |
| `LLM_MODEL`      | `openai/gpt-oss-120b`                                       | Model name sent to the LLM                           |
| `LLM_BASE_URL`   | empty                                                       | Override for another OpenAI-compatible endpoint      |
| `MAX_UPLOAD_MB`  | `5`                                                         | Server-side upload limit; keep in sync with the UI   |
| `UPLOAD_DIR`     | `uploads`                                                   | Image storage directory inside the API container     |
| `ANALYZE_RATE_LIMIT_PER_MINUTE` | `10`                                          | Per-IP limit for `POST /api/analyze`; `0` disables it |
| `WEB_CONCURRENCY`| `1`                                                         | Gunicorn workers in production                       |
| `CORS_ORIGINS`   | `http://localhost:5173`                                     | Comma-separated allowed browser origins              |
| `API_PORT`       | `8000`                                                      | Host port mapped to the API container                |
| `WEB_PORT`       | `5173` dev / `8080` prod                                    | Host port for the Vite dev server or nginx container |
| `VITE_USE_MOCK`  | `false`                                                     | `true` serves frontend mock data instead of the API  |
| `VITE_API_URL`   | `/api`                                                      | Browser-facing API base; baked in at frontend build  |
| `VITE_ASSET_URL` | API origin                                                  | Optional separate origin for relative `/uploads` images |

## API

| Method   | Path                       | Description                                      |
| -------- | -------------------------- | ------------------------------------------------ |
| `GET`    | `/api/health`              | Health check                                     |
| `POST`   | `/api/analyze`             | Multipart image upload; returns the analysis     |
| `GET`    | `/api/history?limit=20&offset=0&sort=newest` | Paginated analyses plus `total` |
| `GET`    | `/api/history/{id}`        | One analysis                                     |
| `DELETE` | `/api/history/{id}`        | Delete an analysis and its image                 |
| `GET`    | `/uploads/{filename}`      | Stored image                                     |

Errors use the envelope `{"error": {"code": "...", "message": "..."}}`. `POST /api/analyze` returns 400 for invalid images, 413 for files or request bodies over the limit, 429 when the per-IP analyze limit is exceeded, and 502 when recipe generation fails. Unexpected failures return `500 INTERNAL_ERROR` without internal details and are logged with a stack trace. Every response includes `X-Request-ID`.

## Production deployment

The production image (`backend/Dockerfile`) is a multi-stage build that runs as a non-root user, installs the CPU-only PyTorch wheel, pre-downloads `HF_MODEL_ID` into the image, runs database migrations, and serves the app with Gunicorn and Uvicorn workers. No source bind mounts or reload mode are used.

The frontend ships as a separate multi-stage image (`frontend/Dockerfile`): Node builds the static bundle, nginx serves it with SPA fallback, gzip, immutable asset caching and security headers. `VITE_API_URL` is the only build-time input needed.

A local production-like stack is available:

```bash
docker compose -f docker-compose.prod.yml up --build
```

It exposes the API on `http://localhost:8000` and the nginx-built frontend on `http://localhost:8080`, persists PostgreSQL data, uploads and the Hugging Face cache in named volumes, and waits for PostgreSQL before running `alembic upgrade head`. The frontend image is built with `VITE_API_URL`, which defaults to `http://localhost:8000/api` in Compose. Change both `API_PORT` and `VITE_API_URL` together if the API is not on port 8000. For a public deployment, build with the public API URL and add the frontend origin to `CORS_ORIGINS`.

### Required production settings

| Variable | Example / notes |
| -------- | --------------- |
| `DATABASE_URL` | `postgresql+psycopg://user:password@host:5432/foodlens?sslmode=require` |
| `LLM_PROVIDER` | `groq` |
| `LLM_API_KEY` | Groq API key; never commit it |
| `LLM_MODEL` | `openai/gpt-oss-120b` |
| `CORS_ORIGINS` | Comma-separated frontend origins, for example `https://foodlens.example.com` |
| `UPLOAD_DIR` | Writable directory on persistent storage, for example `/var/data/uploads` |
| `MAX_UPLOAD_MB` | `5` |
| `ANALYZE_RATE_LIMIT_PER_MINUTE` | `10` |
| `WEB_CONCURRENCY` | `1` on a 512 MB instance; increase on larger instances |
| `HF_MODEL_ID` | Build arg and runtime env; defaults to `nateraw/food` |
| `VITE_API_URL` | Frontend build arg, for example `https://api.example.com/api` |
| `WEB_PORT` | Host port for the frontend container; defaults to `8080` |

`HF_MODEL_ID` is downloaded during the Docker build. If you change it, rebuild the image so the first request does not pay the model-download cost.

### Render

1. Create a Render PostgreSQL instance and a Web Service from this repository. Set the service root directory to `backend` and choose the Docker environment; the Dockerfile runs migrations and starts Gunicorn automatically.
2. Set `DATABASE_URL` to Render's PostgreSQL connection string, changing the scheme to `postgresql+psycopg://` and keeping `sslmode=require` if Render requires TLS.
3. Add the environment variables above, with `LLM_API_KEY` and `CORS_ORIGINS` set for production.
4. Attach a persistent disk and set `UPLOAD_DIR` to a directory on it, for example mount at `/var/data` and use `/var/data/uploads`. Uploads are stored on local disk and served from `/uploads`, so the disk must be writable and persistent.
5. Set the health check path to `/api/health`. Use `WEB_CONCURRENCY=1` on 512 MB instances; the ViT model and dependencies need headroom.

### Railway

1. Create a service from this repository with the root directory set to `backend`, and add the PostgreSQL plugin.
2. Copy the PostgreSQL connection URL into `DATABASE_URL` using the `postgresql+psycopg://` scheme.
3. Add the remaining environment variables, including `LLM_API_KEY`, `CORS_ORIGINS` and `HF_MODEL_ID`, and set the health check path to `/api/health`.
4. Add a volume mounted at `/data` (or another persistent path) and set `UPLOAD_DIR=/data/uploads`.
5. Keep `WEB_CONCURRENCY=1` unless the instance has enough memory for multiple workers. Each worker loads its own copy of the classifier.

Uploads currently use the local filesystem. Running multiple replicas requires shared storage (for example an NFS volume) or replacing `_store_image` and the `/uploads` static mount with object storage. The in-memory analyze rate limiter is per worker; use a shared store such as Redis if you need one global limit across many workers or replicas.

## Tests

Backend tests use an in-memory SQLite database and mocked classifier/LLM responses:

```bash
docker compose exec api pytest
# or, without starting the full stack:
docker compose run --rm --no-deps api pytest
```

Frontend unit and end-to-end tests:

```bash
cd frontend
npm test
npx playwright install chromium
npm run test:e2e
```

`npm run build` runs `tsc --noEmit` before the Vite production build. Playwright mocks the API at the network layer, so the E2E suite does not need PostgreSQL, the model or an LLM key.

Frontend mock mode, useful when the API or LLM is not available:

```bash
cd frontend
VITE_USE_MOCK=true npm run dev
```

## Project structure

```text
foodlens/
  docker-compose.yml
  docker-compose.prod.yml           # nginx frontend + Gunicorn API + PostgreSQL
  .env.example
  README.md
  DEMO.md
  design/                         # Stitch design exports
  backend/
    Dockerfile                    # multi-stage, non-root, model pre-downloaded
    requirements.txt
    alembic/
      versions/20261109_0001_create_analyses.py
      versions/20261109_0002_rename_image_url.py
      versions/20261109_0003_jsonb_payloads.py
    app/
      main.py                     # FastAPI app, lifespan, /uploads mount
      core/config.py              # environment settings
      core/errors.py              # standard error envelope and handlers
      core/logging.py             # JSON log formatter
      core/middleware.py          # request logs, body limit, rate limit
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
  docs/screenshots/               # README screenshots
  frontend/
    Dockerfile                    # multi-stage Node build + nginx
    nginx.conf                    # SPA fallback, gzip, caching, security headers
    vite.config.ts                # proxies /api and /uploads
    vitest.config.ts
    playwright.config.ts
    e2e/                          # History, upload-to-result and responsive flows
    scripts/capture-screenshots.mjs
    src/
      api/analyze.ts              # upload client + mock mode
      api/history.ts              # history client
      api/http.ts                 # fetch wrapper and error envelope
      lib/assets.ts               # resolves /uploads against the API origin
      pages/UploadPage.tsx
      pages/ResultPage.tsx
      pages/HistoryPage.tsx
      pages/StyleguidePage.tsx    # development only
      components/                 # shared design-system components
      components/AnalyzingView.tsx
      test/setup.ts
```

Optional demo data: `docker compose exec api python -m scripts.seed_history --reset`
 inserts 12 analyses and their images so the History page is populated.

## Known limitations

- **Only 101 dish types.** The classifier is Food-101, so it can only return one of 101 labels. A non-food photo still gets the closest food label; the app mitigates this by treating scores below 40% as uncertain and skipping the recipe.
- **LLM recipes may be inaccurate.** Ingredients, quantities and cooking times are generated text, not verified culinary data. Always review them before cooking.
- Single-user app: no authentication or accounts. `POST /api/analyze` has an in-memory, per-worker rate limit; it is not shared across replicas.
- Uploaded images are stored on local disk. Deleting an analysis removes its image, but replacing the database without the uploads folder leaves orphaned files.
- JPEG and PNG only, maximum 5 MB. Large high-resolution phone photos may need resizing.
- CPU-only inference. The production image pre-downloads the model; other environments download it on first use.
- The LLM is required for confident predictions. Without `LLM_API_KEY` (or a reachable `LLM_BASE_URL`), analyses return `502 LLM_FAILURE`.

## Demo

See [DEMO.md](DEMO.md) for a 2-minute walkthrough with the order of screens.
