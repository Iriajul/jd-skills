import asyncio
import uuid

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.matching import docx_tailor
from apps.matching.models import TailoredResumeRecord
from apps.matching.schemas import MatchResult, ParagraphChange, TailoredDocx
from apps.resumes.service import get_resume
from core.config import settings


class NotDocxError(Exception):
    """Raised when a resume can't be tailored because it isn't a .docx upload."""

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
    "optimization. You are given a candidate's resume as a numbered list of paragraphs "
    "(exactly as they appear in their document) and a target job description.\n\n"
    "Your task: choose ONLY the paragraphs whose WORDING should change to better match "
    "the job, and rewrite just those. Return them by their original number.\n\n"
    "STRICT RULES:\n"
    "1. NEVER invent employers, job titles, dates, degrees, projects, or experience. "
    "Fabrication is forbidden. Rephrase only what is already there.\n"
    "2. DO NOT touch the candidate's name, contact info, section headings, company "
    "names, job titles, dates, or URLs. Leave those paragraphs out of your response.\n"
    "3. DO rephrase summary/objective sentences and achievement bullets to use the job "
    "description's terminology and weave in relevant keywords the candidate genuinely "
    "supports. You may add job-relevant keywords to a skills line ONLY if the resume "
    "already demonstrates them.\n"
    "4. Keep each rewritten paragraph roughly the same length as the original so the "
    "document layout is not disturbed.\n"
    "5. Only include a paragraph in 'edits' if you actually changed its wording.\n"
    "In 'injected_keywords', list the job-description keywords you wove in so the user "
    "can verify each one is truthful."
)

_TAILOR_USER_TEMPLATE = (
    "=== TARGET JOB DESCRIPTION ===\n{job_description}\n\n"
    "=== RESUME PARAGRAPHS (numbered) ===\n{paragraphs}\n\n"
    "Return the reworded paragraphs by number."
)


class _ParaEdit(BaseModel):
    index: int = Field(..., description="The paragraph number to rewrite")
    new_text: str = Field(..., description="The reworded paragraph text")


class _TailorOut(BaseModel):
    edits: list[_ParaEdit] = Field(default_factory=list)
    injected_keywords: list[str] = Field(default_factory=list)


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
) -> TailoredDocx | None:
    """Reword the .docx resume for the job. None if not owned; NotDocxError if not a .docx."""
    resume = await get_resume(db, resume_id, user_id)
    if resume is None:
        return None
    if resume.file_format != "docx" or not resume.file_data:
        raise NotDocxError()

    paragraphs = docx_tailor.list_paragraphs(resume.file_data)
    by_index = {i: text for i, text in paragraphs}
    numbered = "\n".join(f"[{i}] {text}" for i, text in paragraphs)

    structured_llm = _llm().with_structured_output(_TailorOut)
    out: _TailorOut = await structured_llm.ainvoke(
        [
            ("system", _TAILOR_SYSTEM_PROMPT),
            (
                "user",
                _TAILOR_USER_TEMPLATE.format(
                    job_description=job_description.strip(),
                    paragraphs=numbered[:_MAX_RESUME_CHARS],
                ),
            ),
        ]
    )

    changes = [
        ParagraphChange(index=e.index, original=by_index.get(e.index, ""), tailored=e.new_text)
        for e in out.edits
        if e.index in by_index and e.new_text.strip() and e.new_text.strip() != by_index[e.index]
    ]
    return TailoredDocx(paragraphs=changes, injected_keywords=out.injected_keywords)


async def render_tailored_docx(
    db: AsyncSession,
    resume_id: uuid.UUID,
    user_id: uuid.UUID,
    edits: dict[int, str],
) -> tuple[bytes, str] | None:
    """Apply edits onto the original .docx; return (bytes, download_filename) or None."""
    resume = await get_resume(db, resume_id, user_id)
    if resume is None:
        return None
    if resume.file_format != "docx" or not resume.file_data:
        raise NotDocxError()

    data = await asyncio.to_thread(docx_tailor.render, resume.file_data, edits)
    base = (resume.filename or "resume").rsplit(".", 1)[0]
    return data, f"{base}_tailored.docx"


# ── Saved tailored resumes ──────────────────────────────────────────────────────
async def save_tailored(
    db: AsyncSession,
    user_id: uuid.UUID,
    resume_id: uuid.UUID,
    title: str,
    content: TailoredDocx,
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
    content: TailoredDocx,
) -> TailoredResumeRecord:
    record.title = title.strip()
    record.content = content.model_dump()
    await db.commit()
    await db.refresh(record)
    return record


async def delete_tailored(db: AsyncSession, record: TailoredResumeRecord) -> None:
    await db.delete(record)
    await db.commit()
