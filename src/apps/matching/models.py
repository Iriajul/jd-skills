import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from common.base_model import TimestampedBase


class TailoredResumeRecord(TimestampedBase):
    """A user-saved, ATS-tailored resume produced for a specific job."""

    __tablename__ = "tailored_resumes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Full TailoredResume structure (name/contact/summary/skills/experience/...).
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
