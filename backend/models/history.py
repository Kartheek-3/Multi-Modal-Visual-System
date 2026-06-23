import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    query_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    query_image_id: Mapped[str | None] = mapped_column(String, nullable=True)
    search_type: Mapped[str] = mapped_column(String, nullable=False)  # text|image|hybrid|voice|camera|nlp
    category_filter: Mapped[str | None] = mapped_column(String, nullable=True)
    results_count: Mapped[int] = mapped_column(default=0)
    response_time_ms: Mapped[float | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    image_id: Mapped[str] = mapped_column(String, ForeignKey("image_metadata.id"), nullable=False)
    collection: Mapped[str] = mapped_column(String, default="Default")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ClickEvent(Base):
    __tablename__ = "click_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    image_id: Mapped[str] = mapped_column(String, ForeignKey("image_metadata.id"), nullable=False)
    search_history_id: Mapped[str | None] = mapped_column(String, ForeignKey("search_history.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
