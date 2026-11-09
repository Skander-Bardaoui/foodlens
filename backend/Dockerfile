FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/cache/huggingface \
    HF_HUB_DISABLE_TELEMETRY=1

ARG HF_MODEL_ID=nateraw/food
ENV HF_MODEL_ID=${HF_MODEL_ID}

WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# CPU-only torch wheel; the CPU index also carries its transitive deps.
RUN pip install --upgrade pip \
    && pip install --index-url https://download.pytorch.org/whl/cpu torch

COPY requirements.txt .
RUN pip install -r requirements.txt

# Bake the classifier into the image so workers do not download it at runtime.
RUN mkdir -p /cache/huggingface \
    && python -c "import os; from transformers import AutoImageProcessor, AutoModelForImageClassification; model_id = os.environ['HF_MODEL_ID']; AutoImageProcessor.from_pretrained(model_id); AutoModelForImageClassification.from_pretrained(model_id)"


FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/cache/huggingface \
    HF_HUB_DISABLE_TELEMETRY=1 \
    PATH="/opt/venv/bin:${PATH}"

ARG HF_MODEL_ID=nateraw/food
ENV HF_MODEL_ID=${HF_MODEL_ID}

RUN groupadd --system foodlens \
    && useradd --system --gid foodlens --create-home --home-dir /home/foodlens foodlens

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /cache/huggingface /cache/huggingface
COPY --chown=foodlens:foodlens app ./app
COPY --chown=foodlens:foodlens alembic ./alembic
COPY --chown=foodlens:foodlens scripts ./scripts
COPY --chown=foodlens:foodlens alembic.ini ./

RUN mkdir -p /app/uploads \
    && chown -R foodlens:foodlens /app /cache/huggingface

USER foodlens

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import os, urllib.request; port = os.getenv('PORT', '8000'); urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health', timeout=3)"

CMD ["sh", "-c", "alembic upgrade head && exec gunicorn app.main:app --workers ${WEB_CONCURRENCY:-1} --worker-class uvicorn_worker.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30 --access-logfile /dev/null --error-logfile - --forwarded-allow-ips='*'"]
