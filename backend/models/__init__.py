# Re-export all models so Alembic / init_db can find them
from models.user import User
from models.image_metadata import ImageMetadata
from models.history import SearchHistory, Favorite, ClickEvent

__all__ = ["User", "ImageMetadata", "SearchHistory", "Favorite", "ClickEvent"]
