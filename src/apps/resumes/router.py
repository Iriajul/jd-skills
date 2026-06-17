import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.resumes import service
from apps.resumes.schemas import ResumeDetailOut, ResumeOut
from apps.users.models import User
from core.deps import get_current_user, get_db

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

_DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _detect_format(file: UploadFile) -> str | None:
    """Return 'docx' or 'pdf' from content type / filename, else None."""
    name = (file.filename or "").lower()
    if file.content_type == _DOCX_TYPE or name.endswith(".docx"):
        return "docx"
    if file.content_type == "application/pdf" or name.endswith(".pdf"):
        return "pdf"
    return None


@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_format = _detect_format(file)
    if file_format is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .docx and .pdf files are accepted. Upload .docx to tailor resumes.",
        )
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 5 MB limit",
        )
    try:
        resume = await service.create_resume(
            db, current_user.id, file.filename or f"resume.{file_format}", content, file_format
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        )
    return ResumeOut.model_validate(resume)


@router.get("/", response_model=list[ResumeOut])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resumes = await service.get_resumes_for_user(db, current_user.id)
    return [ResumeOut.model_validate(r) for r in resumes]


@router.get("/{resume_id}", response_model=ResumeDetailOut)
async def get_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await service.get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeDetailOut.model_validate(resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await service.get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    await service.delete_resume(db, resume)
