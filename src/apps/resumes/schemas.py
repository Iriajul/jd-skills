import uuid
from datetime import datetime

from pydantic import BaseModel

from apps.resumes.models import ResumeStatus


class ResumeOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    chunk_count: int
    status: ResumeStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeDetailOut(ResumeOut):
    """Same as ResumeOut but includes the full extracted text."""
    raw_text: str
