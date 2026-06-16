from celery import Celery

from core.config import settings

celery_app = Celery("atsfriendly")

celery_app.conf.update(
    # ── Broker / Backend ──────────────────────────────────────────────────────
    broker_url=settings.REDIS_URL,
    result_backend=settings.REDIS_URL,

    # ── Serialization ─────────────────────────────────────────────────────────
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # ── Time ──────────────────────────────────────────────────────────────────
    timezone="UTC",
    enable_utc=True,

    # ── Redbeat periodic scheduler ────────────────────────────────────────────
    # Redis-backed; eliminates the need for django-celery-beat and a DB table.
    # Schedules are stored in Redis and survive worker restarts.
    # Add periodic tasks programmatically:
    #   from redbeat import RedBeatSchedulerEntry
    beat_scheduler="redbeat.RedBeatScheduler",
    redbeat_redis_url=settings.REDIS_URL,

    # ── Queue routing ─────────────────────────────────────────────────────────
    # Keeps LLM inference (slow, memory-heavy) off the general scraping queue.
    # Workers consume only their designated queue(s) — see docker-compose.yml.
    task_routes={
        "apps.agents.*": {"queue": "ai_tasks"},
        "apps.jobs.tasks.discover_jobs": {"queue": "job_discovery"},
    },

    # ── Task discovery ────────────────────────────────────────────────────────
    # Uncomment each module as you build the corresponding app.
    # imports=[
    #     "apps.jobs.tasks",
    #     "apps.agents.tasks",
    #     "apps.resumes.tasks",
    # ],
)
