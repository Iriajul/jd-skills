import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str = Field(..., min_length=20)


class TailorRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str = Field(..., min_length=20)


# ── In-place .docx tailoring model ──────────────────────────────────────────────
# We never rebuild the resume. We list the original document's paragraphs, let the
# LLM reword only the ones worth changing, and write those words back into the
# original file — so formatting (fonts, sizes, bullets, layout) is untouched.

class ParagraphChange(BaseModel):
    """A single paragraph the tailoring changed."""

    index: int = Field(..., description="Absolute paragraph position in the document")
    original: str = Field(default="", description="The original wording")
    tailored: str = Field(..., description="The reworded text (user-editable)")


class TailoredDocx(BaseModel):
    """The set of reworded paragraphs + the keywords woven in. The full document
    is reconstructed by applying these onto the stored original .docx."""

    paragraphs: list[ParagraphChange] = Field(default_factory=list)
    injected_keywords: list[str] = Field(
        default_factory=list,
        description="JD keywords woven into the resume, for the user to verify",
    )


class DocxEdit(BaseModel):
    index: int
    text: str


class DocxRenderRequest(BaseModel):
    resume_id: uuid.UUID
    edits: list[DocxEdit] = Field(default_factory=list)


class SavedTailoredCreate(BaseModel):
    resume_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    content: TailoredDocx


class SavedTailoredUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: TailoredDocx


class SavedTailoredListItem(BaseModel):
    """Lightweight row for the saved-versions list (no full content)."""

    id: uuid.UUID
    resume_id: uuid.UUID
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SavedTailoredOut(SavedTailoredListItem):
    content: TailoredDocx


class MatchResult(BaseModel):
    """Structured ATS analysis returned by the LLM."""

    match_score: int = Field(..., ge=0, le=100, description="Overall ATS fit, 0–100")
    summary: str = Field(..., description="Two or three sentence verdict")
    matched_skills: list[str] = Field(
        default_factory=list, description="Skills/keywords present in both the resume and the job"
    )
    missing_skills: list[str] = Field(
        default_factory=list, description="Important job requirements absent from the resume"
    )
    suggestions: list[str] = Field(
        default_factory=list, description="Concrete edits to improve ATS match"
    )
