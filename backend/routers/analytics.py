"""
Analytics Router
GET /analytics/trending      — most searched terms
GET /analytics/dashboard     — user personal stats
GET /analytics/performance   — overall search performance metrics
GET /analytics/categories    — images per category
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.history import SearchHistory, ClickEvent, Favorite
from models.image_metadata import ImageMetadata
from routers.auth import require_user
from models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trending")
async def get_trending(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Top searched text queries in last 7 days."""
    result = await db.execute(
        select(SearchHistory.query_text, func.count(SearchHistory.id).label("count"))
        .where(SearchHistory.query_text.isnot(None))
        .where(~SearchHistory.query_text.like("[image:%"))
        .group_by(SearchHistory.query_text)
        .order_by(func.count(SearchHistory.id).desc())
        .limit(limit)
    )
    rows = result.all()
    return [{"query": q, "count": c} for q, c in rows]


@router.get("/categories")
async def get_category_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ImageMetadata.category, func.count(ImageMetadata.id).label("count"))
        .group_by(ImageMetadata.category)
        .order_by(func.count(ImageMetadata.id).desc())
    )
    rows = result.all()
    return [{"category": cat or "other", "count": c} for cat, c in rows]


@router.get("/performance")
async def get_performance(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.count(SearchHistory.id).label("total_searches"),
            func.avg(SearchHistory.response_time_ms).label("avg_response_ms"),
            func.min(SearchHistory.response_time_ms).label("min_response_ms"),
            func.max(SearchHistory.response_time_ms).label("max_response_ms"),
            func.avg(SearchHistory.results_count).label("avg_results"),
        )
    )
    row = result.one()
    return {
        "total_searches": row.total_searches or 0,
        "avg_response_ms": round(row.avg_response_ms or 0, 2),
        "min_response_ms": round(row.min_response_ms or 0, 2),
        "max_response_ms": round(row.max_response_ms or 0, 2),
        "avg_results": round(row.avg_results or 0, 1),
    }


@router.get("/search-types")
async def get_search_type_breakdown(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SearchHistory.search_type, func.count(SearchHistory.id).label("count"))
        .group_by(SearchHistory.search_type)
        .order_by(func.count(SearchHistory.id).desc())
    )
    rows = result.all()
    return [{"type": t, "count": c} for t, c in rows]


@router.get("/dashboard")
async def user_dashboard(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    searches = await db.execute(
        select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user.id)
    )
    favorites_count = await db.execute(
        select(func.count(Favorite.id)).where(Favorite.user_id == user.id)
    )
    recent = await db.execute(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(5)
    )
    recent_rows = recent.scalars().all()

    return {
        "total_searches": searches.scalar() or 0,
        "total_favorites": favorites_count.scalar() or 0,
        "recent_searches": [
            {"query": r.query_text, "type": r.search_type, "at": r.created_at}
            for r in recent_rows
        ],
    }


@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db)):
    """Public stats for the landing page."""
    img_count = await db.execute(select(func.count(ImageMetadata.id)))
    search_count = await db.execute(select(func.count(SearchHistory.id)))
    user_count = await db.execute(text("SELECT COUNT(*) FROM users"))
    return {
        "total_images": img_count.scalar() or 0,
        "total_searches": search_count.scalar() or 0,
        "total_users": user_count.scalar() or 0,
    }
