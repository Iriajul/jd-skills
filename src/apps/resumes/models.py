import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from common.base_model import TimestampedBase


class ResumeStatus(str, enum.Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class Resume(TimestampedBase):
    __tablename__ = "resumes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[ResumeStatus] = mapped_column(
        Enum(ResumeStatus, name="resumestatus"),
        default=ResumeStatus.processing,
        nullable=False,
    )
    # Original uploaded file, kept so .docx tailoring can re-edit the pristine
    # document each time (preserving exact formatting). "pdf" | "docx".
    file_format: Mapped[str | None] = mapped_column(String(8), nullable=True)
    file_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
