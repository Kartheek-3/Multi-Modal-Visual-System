"""
History & Favorites Router
GET  /history           — recent search history
GET  /favorites         — user's saved images
POST /favorites/{id}    — save image
DELETE /favorites/{id}  — remove image
POST /click/{id}        — log a click event
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.history import SearchHistory, Favorite, ClickEvent
from models.image_metadata import ImageMetadata
from routers.auth import require_user, get_current_user
from models.user import User

router = APIRouter(tags=["History & Favorites"])


@router.get("/history")
async def get_history(
    limit: int = 20,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "query_text": r.query_text,
            "search_type": r.search_type,
            "results_count": r.results_count,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.get("/favorites")
async def get_favorites(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite, ImageMetadata)
        .join(ImageMetadata, Favorite.image_id == ImageMetadata.id)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "favorite_id": fav.id,
            "collection": fav.collection,
            "created_at": fav.created_at,
            "image": {
                "id": img.id,
                "url": img.url,
                "title": img.title,
                "category": img.category,
                "caption": img.caption,
            },
        }
        for fav, img in rows
    ]


@router.post("/favorites/{image_id}")
async def add_favorite(
    image_id: str,
    collection: str = "Default",
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    # Check exists
    img = await db.get(ImageMetadata, image_id)
    if not img:
        raise HTTPException(404, "Image not found.")
    # Check duplicate
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.id, Favorite.image_id == image_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Already in favorites.")
    fav = Favorite(user_id=user.id, image_id=image_id, collection=collection)
    db.add(fav)
    await db.commit()
    return {"message": "Added to favorites.", "favorite_id": fav.id}


@router.delete("/favorites/{image_id}")
async def remove_favorite(
    image_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(Favorite).where(
            Favorite.user_id == user.id, Favorite.image_id == image_id
        )
    )
    await db.commit()
    return {"message": "Removed from favorites."}


@router.post("/click/{image_id}")
async def log_click(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    event = ClickEvent(image_id=image_id, user_id=user.id if user else None)
    db.add(event)
    # Also bump view count
    img = await db.get(ImageMetadata, image_id)
    if img:
        img.view_count = (img.view_count or 0) + 1
    await db.commit()
    return {"message": "Click logged."}
