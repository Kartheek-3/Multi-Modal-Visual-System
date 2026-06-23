import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Text, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class ImageMetadata(Base):
    __tablename__ = "image_metadata"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String, nullable=False)
    filepath: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    url: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)          # JSON array string
    dominant_colors: Mapped[str | None] = mapped_column(Text, nullable=True) # JSON array string
    detected_objects: Mapped[str | None] = mapped_column(Text, nullable=True) # JSON array string
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    phash: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    width: Mapped[int | None] = mapped_column(nullable=True)
    height: Mapped[int | None] = mapped_column(nullable=True)
    file_size: Mapped[int | None] = mapped_column(nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    view_count: Mapped[int] = mapped_column(default=0)
    faiss_id: Mapped[int | None] = mapped_column(nullable=True)  # FAISS vector index
    uploaded_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
