import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from apps.matching import service
from apps.matching.schemas import (
    DocxRenderRequest,
    MatchRequest,
    MatchResult,
    SavedTailoredCreate,
    SavedTailoredListItem,
    SavedTailoredOut,
    SavedTailoredUpdate,
    TailorRequest,
    TailoredDocx,
)
from apps.users.models import User
from core.deps import get_current_user, get_db

router = APIRouter()

_DOCX_MEDIA = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
_NOT_DOCX_DETAIL = "This resume isn't a .docx. Upload a Word (.docx) file to tailor it."


@router.post("/analyze", response_model=MatchResult)
async def analyze_match(
    payload: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await service.analyze_match(
        db, payload.resume_id, current_user.id, payload.job_description
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return result


@router.post("/tailor", response_model=TailoredDocx)
async def tailor_resume(
    payload: TailorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await service.tailor_resume(
            db, payload.resume_id, current_user.id, payload.job_description
        )
    except service.NotDocxError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=_NOT_DOCX_DETAIL)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return result


@router.post("/render")
async def render_tailored(
    payload: DocxRenderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply edits onto the original .docx and stream the tailored Word file."""
    edits = {e.index: e.text for e in payload.edits}
    try:
        result = await service.render_tailored_docx(
            db, payload.resume_id, current_user.id, edits
        )
    except service.NotDocxError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=_NOT_DOCX_DETAIL)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    data, filename = result
    return StreamingResponse(
        BytesIO(data),
        media_type=_DOCX_MEDIA,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Saved tailored resumes ──────────────────────────────────────────────────────
@router.post("/saved", response_model=SavedTailoredOut, status_code=status.HTTP_201_CREATED)
async def save_tailored(
    payload: SavedTailoredCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await service.save_tailored(
        db, current_user.id, payload.resume_id, payload.title, payload.content
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source resume not found"
        )
    return record


@router.get("/saved", response_model=list[SavedTailoredListItem])
async def list_tailored(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_tailored(db, current_user.id)


@router.get("/saved/{record_id}", response_model=SavedTailoredOut)
async def get_tailored(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await service.get_tailored(db, record_id, current_user.id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return record


@router.put("/saved/{record_id}", response_model=SavedTailoredOut)
async def update_tailored(
    record_id: uuid.UUID,
    payload: SavedTailoredUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await service.get_tailored(db, record_id, current_user.id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return await service.update_tailored(db, record, payload.title, payload.content)


@router.delete("/saved/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tailored(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await service.get_tailored(db, record_id, current_user.id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    await service.delete_tailored(db, record)
