# FoodLens

FoodLens identifies dishes from photos. This repository is the **environment scaffold**:
all three services boot and talk to each other, with the business logic still to come.

## Stack

| Layer    | Technology                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3, react-router-dom, TanStack Query, react-dropzone, lucide-react |
| Backend  | FastAPI, Pydantic v2, pydantic-settings, SQLAlchemy 2, Alembic, psycopg 3, Pillow, httpx, pytest             |
| ML       | transformers + PyTorch (CPU-only wheel) for a Hugging Face Food-101 classifier                               |
| Database | PostgreSQL 16                                                                                                |
| Runtime  | Docker Compose (`db`, `api`, `web`)                                                                          |

## Project structure

```
foodlens/
  docker-compose.yml
  .env.example
  .gitignore
  README.md
  design/                     # Stitch design exports
  backend/
    Dockerfile
    requirements.txt
    alembic.ini
    alembic/
    app/
      main.py                 # FastAPI app, CORS, lifespan DB check, GET /api/health
      core/config.py          # Settings read from environment variables
      core/errors.py          # AppError, error codes, JSON exception handlers
      api/analyze.py          # router stub (owned by Person 1)
      api/history.py          # router stub (owned by Person 2)
      db/session.py           # engine, SessionLocal, get_db
      db/models.py            # Analysis model (analyses table)
      db/repository.py        # create/get/list/delete + to_out converter
      ml/                     # empty package for the classifier
      schemas.py              # shared API contract (Pydantic v2)
    scripts/seed_history.py   # 12 demo analyses with generated images
    tests/                    # pytest suite (unit + TestClient integration)
    uploads/                  # saved images (gitignored)
  frontend/
    Dockerfile
    package.json
    vite.config.ts            # proxies /api to the backend
    tailwind.config.js
    src/
      main.tsx
      App.tsx                 # routes: Upload, Result, History
      pages/
      components/
      api/client.ts           # health check used by the header badge
      api/http.ts             # fetch wrapper (base URL, typed ApiError)
      api/types.ts            # shared API contract (mirrors schemas.py)
      api/analyze.ts          # stub (owned by Person 1)
      api/history.ts          # stub (owned by Person 2)
      lib/
```

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

| Service  | URL                             |
| -------- | ------------------------------- |
| Frontend | http://localhost:5173           |
| API      | http://localhost:8000/api/health |
| Database | internal only (`db:5432`)       |

The API container waits for PostgreSQL to pass its healthcheck, runs
`alembic upgrade head`, then starts uvicorn with `--reload`. On startup it logs a
line like `Connected to PostgreSQL at postgresql+psycopg://foodlens:***@db:5432/foodlens`.

Change the defaults by editing `.env` — keep `DATABASE_URL` credentials in sync with
`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`.

## Commands

```bash
# Start / rebuild everything
docker compose up --build

# Start in the background
docker compose up -d --build

# Migrations (also run automatically by the api container)
docker compose exec api alembic upgrade head
docker compose exec api alembic revision --autogenerate -m "your message"

# Seed 12 demo analyses with placeholder images (--reset clears seeded rows first)
docker compose exec api python -m scripts.seed_history --reset

# Backend tests (uses the auto-created "<POSTGRES_DB>_test" database)
docker compose exec api pytest

# Shells
docker compose exec api sh
docker compose exec db psql -U foodlens -d foodlens

# Logs
docker compose logs -f api
docker compose logs -f web

# Stop (keep the database volume) / stop and wipe data
docker compose down
docker compose down -v
```

### Running without Docker

```bash
# Backend (Python 3.11)
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# CPU-only torch, if you don't want the default PyPI build:
# pip install --index-url https://download.pytorch.org/whl/cpu torch
export DATABASE_URL=postgresql+psycopg://foodlens:foodlens@localhost:5432/foodlens
alembic upgrade head
uvicorn app.main:app --reload --port 8000
pytest

# Frontend
cd frontend
npm install
npm run dev    # http://localhost:5173, proxies /api to http://localhost:8000
```

If PostgreSQL is not reachable at `localhost:5432`, set `DATABASE_URL` accordingly
(the Compose URL uses the `db` hostname and only works inside the Docker network).

## Configuration

All backend configuration comes from environment variables via `app/core/config.py`
(`Settings`). `.env.example` documents every variable:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — database credentials
- `DATABASE_URL` — SQLAlchemy URL used by the app and Alembic
- `HF_MODEL_ID` — Hugging Face Food-101 classifier, default `nateraw/food`
- `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL` — optional LLM enrichment layer
- `CORS_ORIGINS` — comma-separated allowed frontend origins
- `MAX_UPLOAD_MB`, `UPLOAD_DIR` — upload limits and storage directory

No secret is hardcoded; `LLM_API_KEY` is optional and stored as a `SecretStr`.

## Notes

- The Docker image installs PyTorch from `https://download.pytorch.org/whl/cpu`, so no
  CUDA runtime is pulled in. The first classification request will download the
  Hugging Face model into the image's cache.
- PostgreSQL has no host port mapping; use `docker compose exec db psql ...` or add a
  `ports` entry if you need external access (it may conflict with a local server on 5432).
- Uploaded images live in `backend/uploads` (bind-mounted and gitignored).
- Tests run against a separate `<POSTGRES_DB>_test` database (created automatically if
  missing) and roll back every test in a savepoint, so development data is never
  touched. Override the target with `TEST_DATABASE_URL` if needed.
- `design/` holds the Stitch exports (`stitch_foodlens_ai_recipe_generator/`).
