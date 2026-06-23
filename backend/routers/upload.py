"""
Upload Router
POST /upload/image  — index a new image into FAISS + DB
POST /upload/camera — same but from camera capture (base64)
"""
from __future__ import annotations

import base64
import json
import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

from config import settings
from database import get_db
from models.image_metadata import ImageMetadata
from routers.auth import get_current_user
from models.user import User
from services.clip_encoder import get_clip_encoder
from services.faiss_index import get_faiss_index
from services.color_analyzer import extract_dominant_colors
from services.duplicate_detector import compute_phash
from services.yolo_detector import get_yolo_detector
from services.llm_service import generate_caption, generate_tags

router = APIRouter(prefix="/upload", tags=["Upload"])


async def _process_and_index(
    data: bytes,
    filename: str,
    category: str | None,
    db: AsyncSession,
    user: User | None,
) -> dict:
    image = Image.open(BytesIO(data)).convert("RGB")
    width, height = image.size

    # Generate unique filename
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    new_filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = settings.IMAGE_DIR / new_filename
    image.save(save_path, quality=90)

    # CLIP embedding
    encoder = get_clip_encoder()
    embedding = encoder.encode_image(image)

    # Colors, hash, YOLO
    colors = extract_dominant_colors(image)
    phash = compute_phash(image)
    objects = get_yolo_detector().detect(image)

    # LLM features (non-blocking — best effort)
    caption, tags = "", []
    try:
        caption = await generate_caption(data)
        tags = await generate_tags(data)
    except Exception:
        pass

    # Build metadata record
    url = f"/static/images/{new_filename}"
    meta_dict = {
        "db_id": "",       # filled after DB insert
        "filename": new_filename,
        "url": url,
        "filepath": str(save_path),
        "category": category or "other",
        "tags": json.dumps(tags),
        "dominant_colors": json.dumps(colors),
        "detected_objects": json.dumps(objects),
        "caption": caption,
        "phash": phash,
        "width": width,
        "height": height,
        "file_size": len(data),
    }

    # Add to FAISS
    index = get_faiss_index(dim=encoder.embedding_dim)
    faiss_id = index.add(embedding, meta_dict)
    index.save()

    # Save to DB
    img_record = ImageMetadata(
        filename=new_filename,
        filepath=str(save_path),
        url=url,
        category=category,
        tags=json.dumps(tags),
        dominant_colors=json.dumps(colors),
        detected_objects=json.dumps(objects),
        caption=caption,
        phash=phash,
        width=width,
        height=height,
        file_size=len(data),
        faiss_id=faiss_id,
        uploaded_by=user.id if user else None,
    )
    db.add(img_record)
    await db.commit()
    await db.refresh(img_record)

    # Update FAISS metadata with real DB id
    index.metadata[faiss_id]["db_id"] = img_record.id
    index.save()

    return {
        "id": img_record.id,
        "filename": new_filename,
        "url": url,
        "faiss_id": faiss_id,
        "caption": caption,
        "tags": tags,
        "colors": colors,
        "objects": objects,
        "dimensions": {"width": width, "height": height},
    }


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    category: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Unsupported file type.")
    if file.size and file.size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large (max {settings.MAX_FILE_SIZE_MB}MB).")
    data = await file.read()
    return await _process_and_index(data, file.filename or "upload.jpg", category, db, user)


@router.post("/camera")
async def upload_camera(
    image_b64: str = Form(...),
    category: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Accept base64-encoded image from camera capture."""
    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        data = base64.b64decode(image_b64)
    except Exception:
        raise HTTPException(400, "Invalid base64 image data.")
    return await _process_and_index(data, "camera_capture.jpg", category, db, user)
