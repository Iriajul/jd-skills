import uuid

from langchain_openai import ChatOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.matching.models import TailoredResumeRecord
from apps.matching.schemas import MatchResult, TailoredResume
from apps.resumes.service import get_resume
from core.config import settings

# Cap the resume text we send to the model — keeps latency/cost bounded.
_MAX_RESUME_CHARS = 12000

_SYSTEM_PROMPT = (
    "You are an ATS (Applicant Tracking System) analyst. Compare a candidate's "
    "resume against a job description and judge how well the resume would pass an "
    "ATS screen for that job. Base every judgement strictly on the text provided — "
    "never invent skills the resume does not contain. Be specific and concise."
)

_USER_TEMPLATE = (
    "=== JOB DESCRIPTION ===\n{job_description}\n\n"
    "=== RESUME ===\n{resume_text}\n\n"
    "Analyse the resume against the job description."
)


_TAILOR_SYSTEM_PROMPT = (
    "You are an expert resume writer specializing in ATS (Applicant Tracking System) "
    "optimization. Rewrite the candidate's resume so it ranks well for the target job.\n\n"
    "STRICT RULES — never break these:\n"
    "1. NEVER invent employers, job titles, dates, degrees, or experience the resume "
    "does not contain. Fabrication is forbidden.\n"
    "2. You MAY rephrase existing bullets using the job description's terminology and "
    "keywords, reorder content to surface the most relevant experience first, and write "
    "a sharper professional summary.\n"
    "3. Only add a skill to the skills list if the resume already demonstrates it. Do not "
    "add skills the candidate has never shown.\n"
    "4. Use standard ATS section names and keep everything single-column and plain.\n"
    "5. Extract the candidate's real name and contact details from the resume verbatim.\n"
    "In 'injected_keywords', list the job-description keywords you wove in so the user "
    "can verify each one is truthful."
)

_TAILOR_USER_TEMPLATE = (
    "=== TARGET JOB DESCRIPTION ===\n{job_description}\n\n"
    "=== ORIGINAL RESUME ===\n{resume_text}\n\n"
    "Produce the ATS-optimized resume."
)


def _llm() -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        openai_api_key=settings.OPENAI_API_KEY,
    )


async def analyze_match(
    db: AsyncSession,
    resume_id: uuid.UUID,
    user_id: uuid.UUID,
    job_description: str,
) -> MatchResult | None:
    """Return an ATS analysis, or None if the resume doesn't belong to the user."""
    resume = await get_resume(db, resume_id, user_id)
    if resume is None:
        return None

    resume_text = resume.raw_text[:_MAX_RESUME_CHARS]

    structured_llm = _llm().with_structured_output(MatchResult)
    result: MatchResult = await structured_llm.ainvoke(
        [
            ("system", _SYSTEM_PROMPT),
            (
                "user",
                _USER_TEMPLATE.format(
                    job_description=job_description.strip(),
                    resume_text=resume_text,
                ),
            ),
        ]
    )
    return result


async def tailor_resume(
    db: AsyncSession,
    resume_id: uuid.UUID,
    user_id: uuid.UUID,
    job_description: str,
) -> TailoredResume | None:
    """Rewrite the resume into an ATS-optimized form, or None if not owned by the user."""
    resume = await get_resume(db, resume_id, user_id)
    if resume is None:
        return None

    resume_text = resume.raw_text[:_MAX_RESUME_CHARS]

    structured_llm = _llm().with_structured_output(TailoredResume)
    result: TailoredResume = await structured_llm.ainvoke(
        [
            ("system", _TAILOR_SYSTEM_PROMPT),
            (
                "user",
                _TAILOR_USER_TEMPLATE.format(
                    job_description=job_description.strip(),
                    resume_text=resume_text,
                ),
            ),
        ]
    )
    return result


# ── Saved tailored resumes ──────────────────────────────────────────────────────
async def save_tailored(
    db: AsyncSession,
    user_id: uuid.UUID,
    resume_id: uuid.UUID,
    title: str,
    content: TailoredResume,
) -> TailoredResumeRecord | None:
    """Persist an (edited) tailored resume. Returns None if the source resume isn't the user's."""
    source = await get_resume(db, resume_id, user_id)
    if source is None:
        return None

    record = TailoredResumeRecord(
        user_id=user_id,
        resume_id=resume_id,
        title=title.strip(),
        content=content.model_dump(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_tailored(
    db: AsyncSession, user_id: uuid.UUID
) -> list[TailoredResumeRecord]:
    result = await db.execute(
        select(TailoredResumeRecord)
        .where(TailoredResumeRecord.user_id == user_id)
        .order_by(TailoredResumeRecord.created_at.desc())
    )
    return list(result.scalars().all())


async def get_tailored(
    db: AsyncSession, record_id: uuid.UUID, user_id: uuid.UUID
) -> TailoredResumeRecord | None:
    result = await db.execute(
        select(TailoredResumeRecord).where(
            TailoredResumeRecord.id == record_id,
            TailoredResumeRecord.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def update_tailored(
    db: AsyncSession,
    record: TailoredResumeRecord,
    title: str,
    content: TailoredResume,
) -> TailoredResumeRecord:
    record.title = title.strip()
    record.content = content.model_dump()
    await db.commit()
    await db.refresh(record)
    return record


async def delete_tailored(db: AsyncSession, record: TailoredResumeRecord) -> None:
    await db.delete(record)
    await db.commit()
