import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str = Field(..., min_length=20)


class TailorRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str = Field(..., min_length=20)


class ExperienceItem(BaseModel):
    title: str = Field(default="", description="Job title")
    company: str = Field(default="", description="Employer name")
    location: str = Field(default="", description="City / remote")
    dates: str = Field(default="", description="e.g. 'Jan 2022 – Present'")
    bullets: list[str] = Field(
        default_factory=list, description="Achievement bullets, rephrased with JD terminology"
    )


class EducationItem(BaseModel):
    degree: str = Field(default="")
    institution: str = Field(default="")
    dates: str = Field(default="")


class TailoredResume(BaseModel):
    """An ATS-optimized resume reconstructed from the candidate's real content."""

    name: str = Field(default="")
    email: str = Field(default="")
    phone: str = Field(default="")
    location: str = Field(default="")
    links: list[str] = Field(default_factory=list, description="LinkedIn, GitHub, portfolio URLs")
    summary: str = Field(default="", description="Professional summary aligned to the job")
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    injected_keywords: list[str] = Field(
        default_factory=list,
        description="JD keywords woven into the resume, for the user to verify",
    )


class SavedTailoredCreate(BaseModel):
    resume_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    content: TailoredResume


class SavedTailoredUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: TailoredResume


class SavedTailoredListItem(BaseModel):
    """Lightweight row for the saved-versions list (no full content)."""

    id: uuid.UUID
    resume_id: uuid.UUID
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SavedTailoredOut(SavedTailoredListItem):
    content: TailoredResume


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
