import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.resumes.embedder import delete_resume_chunks, embed_resume_chunks
from apps.resumes.models import Resume, ResumeStatus
from apps.resumes.parser import chunk_text, extract_text_from_docx, extract_text_from_pdf


async def create_resume(
    db: AsyncSession,
    user_id: uuid.UUID,
    filename: str,
    content: bytes,
    file_format: str,
) -> Resume:
    # Run CPU-bound parsing in a thread so the event loop stays free
    if file_format == "docx":
        raw_text = await asyncio.to_thread(extract_text_from_docx, content)
    else:
        raw_text = await asyncio.to_thread(extract_text_from_pdf, content)
    if not raw_text:
        raise ValueError(
            "No text could be extracted. Make sure the file is not a scanned image."
        )

    chunks = chunk_text(raw_text)

    resume = Resume(
        user_id=user_id,
        filename=filename,
        raw_text=raw_text,
        chunk_count=0,
        status=ResumeStatus.processing,
        file_format=file_format,
        file_data=content,
    )
    db.add(resume)
    await db.flush()  # get the ID before Qdrant upload

    try:
        chunk_count = await asyncio.to_thread(
            embed_resume_chunks, resume.id, user_id, chunks
        )
        resume.chunk_count = chunk_count
        resume.status = ResumeStatus.ready
    except Exception:
        resume.status = ResumeStatus.failed
        raise
    finally:
        await db.commit()
        await db.refresh(resume)

    return resume


async def get_resumes_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Resume]:
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
    )
    return list(result.scalars().all())


async def get_resume(
    db: AsyncSession, resume_id: uuid.UUID, user_id: uuid.UUID
) -> Resume | None:
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def delete_resume(db: AsyncSession, resume: Resume) -> None:
    await asyncio.to_thread(delete_resume_chunks, resume.id)
    await db.delete(resume)
    await db.commit()
