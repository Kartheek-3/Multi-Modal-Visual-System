"""
Search Router
Handles: /search/text, /search/image, /search/hybrid, /search/nlp, /search/color
"""
from __future__ import annotations

import time
import json
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

from config import settings
from database import get_db
from models.history import SearchHistory
from services.clip_encoder import get_clip_encoder
from services.faiss_index import get_faiss_index
from services.llm_service import extract_search_intent, rag_explain_results

router = APIRouter(prefix="/search", tags=["Search"])


# ------------------------------------------------------------------ #
#  Schemas                                                             #
# ------------------------------------------------------------------ #

class SearchResult(BaseModel):
    id: str
    filename: str
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    dominant_colors: Optional[list[dict]] = None
    score: float
    score_percent: float
    caption: Optional[str] = None
    faiss_id: Optional[int] = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query: str
    search_type: str
    response_time_ms: float


def _parse_tags(tags_str: str | None) -> list[str]:
    if not tags_str:
        return []
    try:
        return json.loads(tags_str)
    except Exception:
        return [t.strip() for t in tags_str.split(",") if t.strip()]


def _parse_colors(colors_str: str | None) -> list[dict]:
    if not colors_str:
        return []
    try:
        return json.loads(colors_str)
    except Exception:
        return []


def _format_result(meta: dict) -> SearchResult:
    score = meta.get("score", 0.0)
    return SearchResult(
        id=meta.get("db_id", str(meta.get("faiss_id", 0))),
        filename=meta.get("filename", ""),
        url=meta.get("url", ""),
        title=meta.get("title"),
        description=meta.get("description"),
        category=meta.get("category"),
        tags=_parse_tags(meta.get("tags")),
        dominant_colors=_parse_colors(meta.get("dominant_colors")),
        score=score,
        score_percent=round(min(score * 100, 100), 1),
        caption=meta.get("caption"),
        faiss_id=meta.get("faiss_id"),
    )


async def _log_search(
    db: AsyncSession,
    search_type: str,
    query_text: str | None,
    results_count: int,
    response_time_ms: float,
    category_filter: str | None = None,
    session_id: str | None = None,
    user_id: str | None = None,
):
    record = SearchHistory(
        user_id=user_id,
        session_id=session_id,
        query_text=query_text,
        search_type=search_type,
        category_filter=category_filter,
        results_count=results_count,
        response_time_ms=response_time_ms,
    )
    db.add(record)
    await db.commit()


# ------------------------------------------------------------------ #
#  Text Search                                                         #
# ------------------------------------------------------------------ #

@router.get("/text", response_model=SearchResponse)
async def search_text(
    q: str = Query(..., min_length=1, description="Text search query"),
    top_k: int = Query(settings.DEFAULT_TOP_K, ge=1, le=settings.MAX_TOP_K),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    t0 = time.perf_counter()
    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    embedding = encoder.encode_text(q)
    raw = index.search(embedding, top_k=top_k, category=category)
    results = [_format_result(m) for m in raw]

    elapsed = (time.perf_counter() - t0) * 1000
    await _log_search(db, "text", q, len(results), elapsed, category)
    return SearchResponse(results=results, total=len(results), query=q, search_type="text", response_time_ms=round(elapsed, 2))


# ------------------------------------------------------------------ #
#  Image Search                                                        #
# ------------------------------------------------------------------ #

@router.post("/image", response_model=SearchResponse)
async def search_image(
    file: UploadFile = File(...),
    top_k: int = Form(settings.DEFAULT_TOP_K),
    category: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Unsupported image type.")
    t0 = time.perf_counter()
    data = await file.read()

    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    embedding = encoder.encode_image_bytes(data)
    raw = index.search(embedding, top_k=top_k, category=category)
    results = [_format_result(m) for m in raw]

    elapsed = (time.perf_counter() - t0) * 1000
    await _log_search(db, "image", f"[image:{file.filename}]", len(results), elapsed, category)
    return SearchResponse(results=results, total=len(results), query=f"image:{file.filename}", search_type="image", response_time_ms=round(elapsed, 2))


# ------------------------------------------------------------------ #
#  Hybrid Search                                                       #
# ------------------------------------------------------------------ #

@router.post("/hybrid", response_model=SearchResponse)
async def search_hybrid(
    file: UploadFile = File(...),
    text: str = Form(...),
    alpha: float = Form(0.5, ge=0.0, le=1.0),
    top_k: int = Form(settings.DEFAULT_TOP_K),
    category: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Unsupported image type.")
    t0 = time.perf_counter()
    data = await file.read()
    image = Image.open(BytesIO(data)).convert("RGB")

    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    embedding = encoder.encode_hybrid(image, text, alpha=alpha)
    raw = index.search(embedding, top_k=top_k, category=category)
    results = [_format_result(m) for m in raw]

    elapsed = (time.perf_counter() - t0) * 1000
    await _log_search(db, "hybrid", text, len(results), elapsed, category)
    return SearchResponse(results=results, total=len(results), query=text, search_type="hybrid", response_time_ms=round(elapsed, 2))


# ------------------------------------------------------------------ #
#  Natural Language Search                                             #
# ------------------------------------------------------------------ #

@router.get("/nlp", response_model=SearchResponse)
async def search_nlp(
    q: str = Query(..., min_length=1),
    top_k: int = Query(settings.DEFAULT_TOP_K, ge=1, le=settings.MAX_TOP_K),
    db: AsyncSession = Depends(get_db),
):
    t0 = time.perf_counter()
    intent = await extract_search_intent(q)
    text_query = intent.get("text_query") or q
    category = intent.get("category")

    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    embedding = encoder.encode_text(text_query)
    raw = index.search(embedding, top_k=top_k, category=category)
    results = [_format_result(m) for m in raw]

    elapsed = (time.perf_counter() - t0) * 1000
    await _log_search(db, "nlp", q, len(results), elapsed, category)
    return SearchResponse(results=results, total=len(results), query=q, search_type="nlp", response_time_ms=round(elapsed, 2))


# ------------------------------------------------------------------ #
#  RAG-based search with explanation                                   #
# ------------------------------------------------------------------ #

@router.get("/rag")
async def search_rag(
    q: str = Query(..., min_length=1),
    top_k: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    t0 = time.perf_counter()
    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    embedding = encoder.encode_text(q)
    raw = index.search(embedding, top_k=top_k)
    results = [_format_result(m) for m in raw]

    explanation = await rag_explain_results(q, raw)  # pass raw metadata dicts
    elapsed = (time.perf_counter() - t0) * 1000
    await _log_search(db, "rag", q, len(results), elapsed)
    return {
        "results": [r.model_dump() for r in results],
        "explanation": explanation,
        "query": q,
        "response_time_ms": round(elapsed, 2),
    }
