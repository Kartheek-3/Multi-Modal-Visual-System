import os
from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).parent

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Multimodal Visual Search Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-me-in-production-super-secret-key-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/data/mvse.db"

    # Paths
    DATA_DIR: Path = BASE_DIR / "data"
    IMAGE_DIR: Path = BASE_DIR / "data" / "images"
    INDEX_DIR: Path = BASE_DIR / "data" / "index"

    # CLIP Model
    CLIP_MODEL: str = "ViT-B-32"
    CLIP_PRETRAINED: str = "openai"

    # FAISS
    FAISS_INDEX_PATH: str = str(BASE_DIR / "data" / "index" / "images.index")
    FAISS_META_PATH: str = str(BASE_DIR / "data" / "index" / "metadata.json")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    # Search
    DEFAULT_TOP_K: int = 20
    MAX_TOP_K: int = 100

    # Upload
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.INDEX_DIR.mkdir(parents=True, exist_ok=True)
