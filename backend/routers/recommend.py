"""
Recommend Router
GET /recommend/{image_id}   — similar images (content-based)
GET /recommend/personalized — based on user click/search history
GET /images/{image_id}      — single image detail
GET /images                 — browse all images (paginated)
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.image_metadata import ImageMetadata
from models.history import SearchHistory, ClickEvent
from routers.auth import get_current_user
from models.user import User
from services.clip_encoder import get_clip_encoder
from services.faiss_index import get_faiss_index

router = APIRouter(tags=["Recommend & Browse"])


def _img_to_dict(img: ImageMetadata) -> dict:
    tags = []
    try:
        tags = json.loads(img.tags or "[]")
    except Exception:
        pass
    colors = []
    try:
        colors = json.loads(img.dominant_colors or "[]")
    except Exception:
        pass
    return {
        "id": img.id,
        "filename": img.filename,
        "url": img.url,
        "title": img.title,
        "description": img.description,
        "category": img.category,
        "tags": tags,
        "dominant_colors": colors,
        "caption": img.caption,
        "rating": img.rating,
        "view_count": img.view_count,
        "width": img.width,
        "height": img.height,
        "faiss_id": img.faiss_id,
        "created_at": img.created_at,
    }


@router.get("/images")
async def browse_images(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    category: Optional[str] = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest|most_viewed|highest_rated)$"),
    db: AsyncSession = Depends(get_db),
):
    q = select(ImageMetadata)
    if category:
        q = q.where(ImageMetadata.category == category)
    if sort == "newest":
        q = q.order_by(ImageMetadata.created_at.desc())
    elif sort == "oldest":
        q = q.order_by(ImageMetadata.created_at.asc())
    elif sort == "most_viewed":
        q = q.order_by(ImageMetadata.view_count.desc())
    elif sort == "highest_rated":
        q = q.order_by(ImageMetadata.rating.desc())
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    images = result.scalars().all()
    return {"images": [_img_to_dict(i) for i in images], "page": page, "page_size": page_size}


@router.get("/images/{image_id}")
async def get_image(image_id: str, db: AsyncSession = Depends(get_db)):
    img = await db.get(ImageMetadata, image_id)
    if not img:
        raise HTTPException(404, "Image not found.")
    return _img_to_dict(img)


@router.get("/recommend/personalized")
async def personalized_recommendations(
    top_k: int = Query(12, ge=1, le=30),
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        # Fall back to most-viewed images for anonymous users
        result = await db.execute(
            select(ImageMetadata).order_by(ImageMetadata.view_count.desc()).limit(top_k)
        )
        images = result.scalars().all()
        return {"recommendations": [_img_to_dict(i) for i in images], "type": "popular"}

    # Get user's recent click history
    clicks = await db.execute(
        select(ClickEvent.image_id).where(ClickEvent.user_id == user.id).limit(5)
    )
    clicked_ids = [r[0] for r in clicks.all()]

    if not clicked_ids:
        # Fall back to newest images
        result = await db.execute(
            select(ImageMetadata).order_by(ImageMetadata.created_at.desc()).limit(top_k)
        )
        images = result.scalars().all()
        return {"recommendations": [_img_to_dict(i) for i in images], "type": "newest"}

    # Average embeddings of clicked items and search FAISS
    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)
    import numpy as np

    embeddings = []
    for cid in clicked_ids:
        img = await db.get(ImageMetadata, cid)
        if img and img.faiss_id is not None:
            vec = np.zeros(encoder.embedding_dim, dtype=np.float32)
            index.index.reconstruct(img.faiss_id, vec)
            embeddings.append(vec)

    if not embeddings:
        result = await db.execute(
            select(ImageMetadata).order_by(ImageMetadata.view_count.desc()).limit(top_k)
        )
        images = result.scalars().all()
        return {"recommendations": [_img_to_dict(i) for i in images], "type": "popular"}

    avg_emb = np.mean(embeddings, axis=0, keepdims=True).astype(np.float32)
    avg_emb = avg_emb / (np.linalg.norm(avg_emb) + 1e-8)

    raw = index.search(avg_emb, top_k=top_k + 5)
    # Exclude already-clicked
    results = [r for r in raw if r.get("db_id") not in clicked_ids][:top_k]
    return {"recommendations": results, "type": "personalized"}


@router.get("/recommend/{image_id}")
async def recommend_similar(
    image_id: str,
    top_k: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    img = await db.get(ImageMetadata, image_id)
    if not img or img.faiss_id is None:
        raise HTTPException(404, "Image not indexed.")

    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    # Reconstruct embedding from FAISS index
    import numpy as np
    vec = np.zeros((1, encoder.embedding_dim), dtype=np.float32)
    index.index.reconstruct(img.faiss_id, vec[0])

    raw = index.search(vec, top_k=top_k + 1)
    # Exclude the query image itself
    results = [r for r in raw if r.get("db_id") != image_id][:top_k]
    return {"recommendations": results, "based_on": image_id}
