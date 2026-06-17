from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apps.matching.router import router as matching_router
from apps.resumes.router import router as resumes_router
from apps.users.router import router as users_router
from core.config import settings
from core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    # Tables are managed by Alembic — do NOT call Base.metadata.create_all here.
    # Add any startup logic (warm up LLM client, ping Qdrant, etc.) below.
    yield
    # ── Shutdown ──────────────────────────────────────────────────────────────
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ──────────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(users_router,   prefix="/api/v1/users",   tags=["Users"])
app.include_router(resumes_router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(matching_router, prefix="/api/v1/matching", tags=["Matching"])
# app.include_router(jobs_router,   prefix="/api/v1/jobs",    tags=["Jobs"])
# app.include_router(agents_router, prefix="/api/v1/agents",  tags=["Agents"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
