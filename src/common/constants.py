# ── Celery queue names ────────────────────────────────────────────────────────
# Mirror what is declared in workers/celery_app.py task_routes.
# Use these constants in @celery_app.task(queue=QUEUE_AI_TASKS) decorators.
QUEUE_DEFAULT = "default"
QUEUE_JOB_DISCOVERY = "job_discovery"
QUEUE_AI_TASKS = "ai_tasks"

# ── Qdrant collection names ───────────────────────────────────────────────────
# One collection per semantic domain. Defined once here so a rename
# touches a single file rather than every agent and RAG module.
COLLECTION_JOBS = "jobs"
COLLECTION_RESUMES = "resumes"
COLLECTION_SKILLS = "skills"

# ── Application tracking statuses ────────────────────────────────────────────
class ApplicationStatus:
    DISCOVERED = "discovered"  # job found, not yet applied
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
