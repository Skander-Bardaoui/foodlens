# FoodLens Final Completeness Audit

**Audit date:** 2026-11-09  
**Repository:** `C:\Users\skonb\Desktop\Nouveau dossier\foodlens`  
**Branch:** `main`  
**Audited commit:** `b6978b4` (functional runtime code identical to `6dea758`; later commits are tests/docs)  
**Verdict:** **PASS WITH MINOR ISSUES** — the required product behavior works end to end in development and production Compose. No blocking defect remains. One inconsistent 404 payload was found and fixed; the remaining items are dependency advisories, optional demo assets, and documented design omissions.

## Executive summary

| # | Area | Status | Key evidence |
|---|------|--------|--------------|
| 1 | Stack starts from Compose | PASS (port overrides) | `db`, `api`, `web` healthy; API health 200; SPA 200; migration `0003_jsonb_payloads (head)` |
| 2 | Backend checklist | PASS | 60 pytest tests, 91% coverage; JSONB schema; up/down/up migration; full curl matrix; 429; CORS; request IDs |
| 3 | Frontend checklist | PASS | 24 Vitest tests, 6 mocked Playwright tests, typecheck/lint/build pass; accessibility DOM checks pass |
| 4 | Real browser integration | PASS | 4/4 real-stack Playwright tests on dev **and** rebuilt production |
| 5 | API contract | PASS | Live OpenAPI matches `schemas.py` and `api/types.ts`; no contract fields changed |
| 6 | Delivery requirements | PASS with notes | Non-root Gunicorn API, nginx frontend, seeded demo data, README/screenshots/demo script, no secrets in git |

Host ports 5173, 8000 and 8080 are occupied by unrelated projects on this machine. FoodLens was therefore exercised with the supported overrides: development web `http://127.0.0.1:15173` / API `http://127.0.0.1:18001`, production web `http://localhost:18080` / API `http://localhost:18000`. The default mapping in Compose remains 5173/8000/8080.

## 1. Stack startup

| Check | Status | Evidence |
|-------|--------|----------|
| Root `.env` from `.env.example` | PASS | `.env` is gitignored; live `LLM_API_KEY` is present there only |
| `docker compose down -v` + `up --build` cold start | PASS | `db`, `api`, `web` reached healthy/running; startup recovered after Docker Desktop was restarted mid-audit |
| PostgreSQL reachable | PASS | API log: `Connected to PostgreSQL at postgresql+psycopg://foodlens:***@db:5432/foodlens` |
| Alembic upgrade on start | PASS | `alembic current` -> `0003_jsonb_payloads (head)`; Compose API command runs `alembic upgrade head` |
| Classifier loaded once | PASS | Production log contains exactly one `Loading image classifier nateraw/food` and one `Image classifier ready` |
| `GET /api/health` | PASS | `{"status":"ok"}` on dev and prod |
| Frontend served | PASS (override) | `web_root=200`, `/healthz=200`; SPA `/history` returns 200 with nginx fallback |
| Demo data retained | PASS | 12 analyses in both dev and production after seeding |

## 2. Backend checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Table schema and payload types | PASS | Columns: `id:uuid`, `label:varchar`, `confidence:double`, `uncertain:bool`, `top3/ingredients/steps:jsonb`, `image_path:varchar`, `created_at:timestamptz` |
| Migration up / down / up | PASS | Throwaway database `foodlens_migration_test`: `upgrade head` -> 0001/0002/0003, `downgrade base`, `upgrade head` all succeeded; database dropped after test |
| Classifier top-3 clean labels | PASS | Pizza -> `[('Pizza', 0.9961), ('Bruschetta', 0.0003), ('Garlic bread', 0.0002)]` |
| JPEG and PNG accepted | PASS | JPEG pizza/sushi/salad/pasta; PNG non-food screenshot accepted and classified |
| `MAX_UPLOAD_MB` limit | PASS | 5.6 MB PNG -> `413 {"error":{"code":"FILE_TOO_LARGE","message":"Request body exceeds the 5 MB upload limit"}}` |
| Corrupted image | PASS | Text bytes named `.jpg` -> `400 {"error":{"code":"INVALID_IMAGE","message":"Could not read image file"}}` |
| Recipe validation, retry, timeout, LLM 429 | PASS | `test_recipe.py`: JSON validation, one retry, double-invalid failure, timeout, provider 429, network error, missing key |
| Confident analyze | PASS | Pizza `200`, confidence `0.9961`, 9 ingredients, 8 steps, UUID id, `/uploads/<uuid>.jpg` |
| Uncertain analyze (< 0.40) | PASS | Non-food PNG -> Baklava `0.1218`, `uncertain=true`, empty ingredients/steps, UUID id, `/uploads/<uuid>.png`, persisted then deleted (`204`) |
| History list/get/delete | PASS | 12 rows, newest-first pagination, confidence sort, 404 on missing, 422 on invalid UUID |
| Image deleted with record | PASS | Real-stack test: uploaded asset `200` before delete, `404` after delete from result and history |
| `/uploads` static serving | PASS | `200 image/jpeg`, correct size, on dev and prod |
| Standard error envelope | FIXED | Unknown routes previously returned `{"detail":"Not Found"}`; now `{"error":{"code":"NOT_FOUND","message":"Not Found"}}` (`6dea758`) |
| OpenAPI summaries/models | PASS | `/api/analyze` 200/400/413/422/429/502 documented; history 200/404/422 documented; `AnalysisOut`, `AnalysisList`, `ErrorResponse`, `Top3Item` models present |
| Structured JSON logs + request ID | PASS | `request.completed` JSON includes `request_id`, `method`, `path`, `status`, `duration_ms`; `X-Request-ID` returned |
| Global exception handler | PASS | Unexpected classifier exception is logged and returned as `500 INTERNAL_ERROR` without leaking details (`test_analyze.py`) |
| Rate limit | PASS | 11 rapid uploads -> first 10 `400`, 11th `429` with `Retry-After: 60`, `X-RateLimit-Limit: 10`, `RATE_LIMITED` body |
| CORS | PASS | Preflight from configured origin returns `200` with `access-control-allow-origin`; production allows `http://localhost:18080` |
| Tests and coverage | PASS | **60 passed**; **91% total coverage** (`app/api/*` and schemas 100%, recipe 92%, middleware 89%) |

### Analyze matrix (live API)

All successful records were deleted after capture; history returned to 12 rows.

| Input | Status | Result |
|-------|--------|--------|
| `pizza.jpg` | 200 | Pizza, 0.9961, recipe, 9 ingredients / 8 steps |
| `sushi.jpg` | 200 | Sushi, 0.9944, recipe, 9 / 6 |
| `salad.jpg` | 200 | Caesar salad, 0.9303, recipe, 9 / 5 |
| `pasta.jpg` | 200 | Spaghetti carbonara, 0.7775, recipe, 8 / 6 |
| `03_cheeseburger.jpg` | 200 | Hamburger, 0.9873, recipe, 11 / 6 |
| Non-food PNG | 200 | Baklava, 0.1218, `uncertain=true`, 0 / 0, no LLM recipe |
| Corrupted `.jpg` | 400 | `INVALID_IMAGE` envelope |
| 5.6 MB PNG | 413 | `FILE_TOO_LARGE` envelope |

`pytest-cov` is not declared in `backend/requirements.txt`; coverage was measured by installing it into the running development container. The plain suite runs without it.

## 3. Frontend checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Design tokens, no copied inline styles | PASS | Tailwind theme defines brand/accent/surface/ink/muted tokens; only two inline styles remain, both dynamic progress widths (`width: ${percent}%`) |
| Required components and pages | PASS | Upload/DropZone, AnalyzingView, ResultPage, HistoryPage, HistoryCard, ErrorState, Toast, ConfirmDialog, skeletons, Navbar/Footer, 404 page |
| Upload preview / remove / button state | PASS | Browser check: preview alt appears, Analyze enabled, remove returns to “No photo”, Analyze disabled |
| Recent analyses = last 4 | PASS | Live home DOM contains exactly 4 `a[href^="/result/"]`; grid `sm:grid-cols-2 lg:grid-cols-4`; screenshot `docs/screenshots/upload.png` |
| Analyzing state | PASS | Real-stack test waits for `data-testid="analyzing-state"` after clicking Analyze |
| Result screen | PASS | Real-stack test sees dish heading, confidence, predictions, ingredients and numbered steps; direct refresh works |
| Uncertain result | PASS | Real-stack test sees amber suggestion banner, top-3 chips, “Try another photo”, and no generated recipe |
| History search / sort / grid / delete / load more / empty | PASS | DOM check: 6 initial cards -> 12 after load more; search `no-such-dish` -> `No results for “no-such-dish”`; sort options `Newest first`, `Highest confidence`; delete + toast covered by mocked E2E |
| Errors, toasts, 404 | PASS | Inline analyze error on aborted request; `Analysis deleted` toast; `/does-not-exist` -> `Error 404 • Page not found`; API-down screenshot `docs/screenshots/error-api-down.png` |
| Real API, no mocks | PASS | Dev `VITE_USE_MOCK=false`; real-stack Playwright performs actual classifier/LLM/PostgreSQL/upload calls |
| Styleguide excluded in production | PASS | Production bundle markers for `Styleguide` and `VITE_USE_MOCK`: **0** and **0** |
| Accessibility | PASS | `h1` present; dropzone `role=button tabindex=0`; file input labelled; search/sort labelled; all images have alt text; history cards `role=link tabindex=0`; ingredient buttons expose `aria-pressed`; delete dialog `aria-modal`, labelled/described, tabs stay inside, Escape closes, focus returns to Delete |
| Vitest + Playwright | PASS | **24/24** unit tests; **6/6** mocked Playwright tests; real stack **4/4** on dev and **4/4** on production |
| Typecheck / lint / build | PASS | `npm run typecheck`, `npm run lint`, `npm run build` all exit 0 |
| Responsive / visual comparison | PASS with omissions | No horizontal overflow at 390/768/1440; screenshots refreshed from live app; decorative Stitch sections (benchmark strip, nutrition/favorites) were intentionally not implemented |

## 4. Real browser integration

| Flow | Status | Evidence |
|------|--------|----------|
| Pizza: upload -> analyzing -> result -> history -> refresh -> delete | PASS | Real-stack test 1 on dev and production; uploaded image 200 then 404; history card disappears |
| Ambiguous/non-food photo | PASS | Real-stack test 2: uncertain banner, no recipe, delete from history, image 404 |
| 10 MB upload rejected client-side | PASS | Exact message `That image is 10.0 MB. Please choose one under 5 MB.`; Analyze disabled; zero analyze requests |
| API unavailable during analyze | PASS | Route-abort test shows inline connection error and re-enabled button; separate live test stopped the API container mid-request, showed `Analysis failed (HTTP 500). Please try again.`, then recovered after restart |
| Direct refresh of `/result/:id` and `/history` | PASS | Real-stack test refreshes both; production nginx SPA fallback returns 200 |
| Delete from result and from history | PASS | Both flows tested; PostgreSQL row and uploaded file are removed |

## 5. API contract

Field-by-field comparison of `backend/app/schemas.py`, live `/openapi.json`, and `frontend/src/api/types.ts`:

| Model | Backend / OpenAPI | Frontend | Match |
|-------|-------------------|----------|-------|
| `AnalysisOut` / `Analysis` | `id,label,confidence,uncertain,top3,ingredients,steps,image_url,created_at` | same names and types | Yes |
| `AnalysisList` | `items,total` | `AnalysisList` items + total | Yes |
| `Top3Item` | `label,score` | `Top3Item` | Yes |
| `ErrorResponse` | `error:{code,message}` | parsed into `ApiError` | Yes |
| Health | `{status}` | health badge reads `status` | Yes |

No field was renamed or removed. Changes made during the audit were documentation-only (422 response) plus removal of an unused frontend `Recipe` type. `schemas.py` and the runtime JSON contract were not changed.

## 6. Delivery requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Production API image | PASS | Multi-stage Python image; `USER foodlens`; runtime `uid=999(foodlens)`; Gunicorn with `UvicornWorker`; healthcheck |
| Model pre-downloaded | PASS | Dockerfile pre-downloads `HF_MODEL_ID`; production volume cached; one load in startup log |
| Production frontend | PASS | Multi-stage Node build -> nginx; SPA fallback, gzip, immutable asset cache, security headers, `/healthz` |
| Production Compose starts | PASS | Rebuilt from current source; API/web/db healthy on 18000/18080; real-stack E2E 4/4 |
| `.env.example` complete | PASS | DB, model, LLM provider/key/model/base URL, CORS, upload limit/dir, rate limit, workers, ports, mock flag, production API URL |
| No secrets in git | PASS | `.env` ignored (`git check-ignore`); live key (56 chars) appears in **0** commits; tracked tree has no real key (README now uses `<your-groq-api-key>`) |
| README | PASS | Under-10-minute quick start, architecture, configuration, API, tests, production deployment, known limitations, screenshots |
| Screenshots current | PASS | `docs/screenshots/{upload,history,result}.png` regenerated from live seeded app; upload shows four recent items |
| Seed/demo data | PASS | `python -m scripts.seed_history --reset` creates 12 analyses + images in dev and prod |
| 2-minute demo script | PASS | `DEMO.md` has timed screen order, narration, fallback troubleshooting |
| No TODOs/stubs/console.log/dead code | PASS | Scan excluding design/docs/screenshot scripts found no TODO/FIXME/debugger/stub; unused `PagePlaceholder` and `Recipe` removed |
| Dependency audit | NOTE | Production runtime: 2 moderate (react-router). Dev/build: 13 (1 high, 2 critical, 10 moderate) in Vite/Vitest/ESLint toolchain. No high/critical ship to production |

## Bugs found and fixed

| # | Problem | Fix commit |
|---|---------|------------|
| 1 | Home requested only 3 recent analyses and rendered a 3-column grid | `3d44420` |
| 2 | Deleting from Result left stale analysis/history query caches | `3d44420` |
| 3 | Footer API Docs linked to `/api/docs` (404); empty `VITE_API_URL` resolved to empty base; dev had no `/docs` proxy | `496baa8` |
| 4 | Unused `PagePlaceholder` component and `Recipe` type | `252a49f` |
| 5 | No frontend lint command/config and no real-stack Playwright coverage; history cards not individually targetable | `7a638df` |
| 6 | Unknown routes bypassed the standard error envelope (`{"detail":...}`) | `6dea758` |
| 7 | Stale screenshots, 3-item screenshot fixtures, wrong screenshot default port, README test command missing `REAL_API_ORIGIN` | `fc9c54f`, `6c73cd4` |
| 8 | README used `gsk_...` as a key example that looks like a real key | `701edcc` |
| 9 | README seed command did not explain placeholder images/source photo files | `b6978b4` |
| 10 | Analyze OpenAPI omitted 422; stale “owned by Person 2” comment | `9afb188` |

All fixes are small, isolated commits on `main`; no working feature was rewritten.

## Remaining issues

### Medium

- **react-router advisories (production).** `npm audit --omit=dev` reports 2 moderate issues: open redirect via backslash in `Link`/`useNavigate`, and arbitrary constructor injection in SSR hydration. The app has no SSR and uses static internal links, so practical exposure is low, but the fix requires a v7 major migration (`react-router-dom@7.18.5`). Plan that migration rather than forcing it during this audit.
- **Development toolchain advisories.** Full `npm audit` reports 15 (2 critical in Vitest/tinypool, 1 high in Vite, 12 moderate). These are dev/build tools and are not in the production bundle; resolving them requires major upgrades of Vite/Vitest/typescript-eslint. Track separately.

### Low

- **Seed images are placeholders by default.** A clean checkout has no `backend/uploads/source_photos`, so seeded thumbnails are generated labels, not food photos. This audit populated that directory locally with the credited Wikimedia images (untracked); README now explains the behavior.
- **`pytest-cov` is not declared.** Coverage is reproducible only after installing it (the suite itself needs only `pytest`). Add it to a dev requirements file if coverage becomes CI-gated.
- **Some Stitch design extras are not implemented.** Benchmark strip, nutrition/allergen detail, save/favorite controls and extra history filters are absent. They were not in the required checklist; the implemented screens match the primary design language.
- **Nginx runs as the official image default.** The API is explicitly non-root (`foodlens`, uid 999); nginx master runs as root with worker processes dropping to `nginx`. This is standard for the official image but stricter non-root orchestration would need a custom entrypoint.

### Operational

- **Rotate the Groq key that was shared in chat.** It exists only in the gitignored `.env`; no commit contains it. Rotation is a credential-hygiene action outside the repository.

## Items that could not be verified exactly as specified

- **Default ports 5173/8000/8080** could not be bound because unrelated projects (`docmind`) already own them. FoodLens was verified with the documented `WEB_PORT`/`API_PORT` overrides; Compose configuration itself is unchanged.
- **First-ever model download timing** was not re-measured after the model cache was populated. The startup log confirms a single load; the Docker image pre-downloads the model for production.
- **Recipe quality** was not judged; this remains an explicit product limitation (AI-written recipes must be reviewed).
- **Visual review** used live screenshots plus overflow checks, not pixel-diff tooling against Stitch.

## Reproduce the evidence

```bash
# Backend
docker compose exec api python -m pytest -q
docker compose exec api python -m pytest --cov=app --cov-report=term -q   # needs pytest-cov
docker compose exec api alembic current
curl -s http://127.0.0.1:18001/api/health
curl -s -w '\n%{http_code}\n' http://127.0.0.1:18001/api/unknown

# Frontend
cd frontend
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e

# Real stack (dev ports used on this machine)
REAL_STACK=1 REAL_API_ORIGIN=http://127.0.0.1:18001 \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:15173 \
npx playwright test e2e/real-stack.spec.ts --workers=1

# Real stack (production)
REAL_STACK=1 REAL_API_ORIGIN=http://localhost:18000 \
PLAYWRIGHT_BASE_URL=http://localhost:18080 \
npx playwright test e2e/real-stack.spec.ts --workers=1

# Production checks
curl -s http://localhost:18000/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/healthz
docker compose -f docker-compose.prod.yml exec api id
docker compose -f docker-compose.prod.yml exec api alembic current
```

## Demo commands

Fresh machine with free default ports:

```bash
cp .env.example .env
# Edit .env and set LLM_API_KEY (Groq) or LLM_BASE_URL.
docker compose up --build
# Optional demo data:
docker compose exec api python -m scripts.seed_history --reset
# Open http://localhost:5173
```

If ports are busy (this machine):

```bash
API_PORT=18001 WEB_PORT=15173 docker compose up --build
# Open http://127.0.0.1:15173

API_PORT=18000 WEB_PORT=18080 CORS_ORIGINS=http://localhost:18080 \
VITE_API_URL=http://localhost:18000/api \
docker compose -f docker-compose.prod.yml up -d --build
# Open http://localhost:18080
```

Production:

```bash
docker compose -f docker-compose.prod.yml up --build
# Open http://localhost:8080
```

This machine already has both stacks running:

```text
Development: http://127.0.0.1:15173   API http://127.0.0.1:18001   (12 seeded analyses)
Production:  http://localhost:18080   API http://localhost:18000   (12 seeded analyses)
```

Follow `DEMO.md` for the 2-minute walkthrough: upload a pizza -> analyzing -> result -> check ingredients -> upload a non-food photo -> uncertain state -> delete -> show API docs/health.
