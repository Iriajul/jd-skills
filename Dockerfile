# =============================================================================
# Stage 1 — Builder
# =============================================================================
# Purpose: compile Python packages that need C extensions (psycopg2, cryptography).
# This stage is NEVER shipped. Only the finished /opt/venv is copied forward.
# Result: production image has zero build toolchain (gcc, make, libpq-dev, etc.)
# =============================================================================
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /build

# System build dependencies — only needed to compile C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create an isolated virtual environment so the copy to the next stage is clean
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# ── Layer cache strategy ──────────────────────────────────────────────────────
# Copy requirements BEFORE source code. Docker re-runs pip install only when
# a requirements file changes, not on every source edit — keeps rebuilds fast.
COPY ./requirements /build/requirements/

# ARG lets docker-compose.override.yml switch to development.txt for local dev
ARG REQUIREMENTS_FILE=production.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements/${REQUIREMENTS_FILE}


# =============================================================================
# Stage 2 — Production
# =============================================================================
# Lean runtime image. Contains:
#   - Python runtime
#   - libpq5 (Postgres runtime lib — NOT the -dev headers)
#   - curl (health checks)
#   - The compiled venv from Stage 1
#   - Application source
# Does NOT contain: gcc, make, libpq-dev, pip cache, build artifacts
# =============================================================================
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# libpq5  = PostgreSQL client runtime library (smaller than libpq-dev)
# curl    = used by the Qdrant health check and any wget-style calls
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pull the fully-compiled virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application source — separate COPY keeps this layer independent from
# the venv layer, so code changes don't invalidate the dependency cache
COPY ./src /app/src/

# Copy env files (only .env.example lands in the image — actual .env is gitignored
# and supplied at runtime via docker-compose env_file)
COPY src/.env* /app/src/

WORKDIR /app/src

# Run as non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Gunicorn as process manager + UvicornWorker per process:
#   - Gunicorn handles worker lifecycle, graceful restarts, signals
#   - UvicornWorker gives each process full async/ASGI capability
#   - --timeout 120 covers LLM inference calls (30-60s typical)
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120", \
     "--access-logfile", "-"]
