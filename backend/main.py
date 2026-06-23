"""
FastAPI Application Entry Point — Multimodal Visual Search Engine
"""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from config import settings
from database import init_db

# Import all models so SQLAlchemy sees them before create_all
import models  # noqa: F401

from routers import search, auth, upload, ai, history, analytics, recommend

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB + warm up CLIP + FAISS."""
    logger.info("🚀 Starting Multimodal Visual Search Engine...")
    await init_db()
    logger.info("✅ Database initialised.")

    # Warm up CLIP encoder (loads model into memory)
    from services.clip_encoder import get_clip_encoder
    encoder = get_clip_encoder()

    # Initialise FAISS index (load from disk if exists)
    from services.faiss_index import get_faiss_index
    index = get_faiss_index(dim=encoder.embedding_dim)
    logger.info(f"✅ FAISS index ready — {index.total()} vectors.")

    yield
    logger.info("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered multimodal image search engine with CLIP + FAISS + Gemini.",
    lifespan=lifespan,
)

# ------------------------------------------------------------------ #
#  CORS                                                                #
# ------------------------------------------------------------------ #
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------ #
#  Request timing middleware                                           #
# ------------------------------------------------------------------ #
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    ms = round((time.perf_counter() - t0) * 1000, 2)
    response.headers["X-Response-Time"] = f"{ms}ms"
    return response

# ------------------------------------------------------------------ #
#  Static files (served images)                                        #
# ------------------------------------------------------------------ #
settings.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/images", StaticFiles(directory=str(settings.IMAGE_DIR)), name="images")

# ------------------------------------------------------------------ #
#  Routers                                                             #
# ------------------------------------------------------------------ #
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(upload.router)
app.include_router(ai.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(recommend.router)

# ------------------------------------------------------------------ #
#  Health check                                                        #
# ------------------------------------------------------------------ #
@app.get("/health", tags=["System"])
async def health():
    from services.faiss_index import get_faiss_index
    from services.clip_encoder import get_clip_encoder
    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "indexed_images": index.total(),
        "clip_model": settings.CLIP_MODEL,
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "docs": "/docs"}
