"""
AI Router — caption, VQA, tags, product description, background removal
"""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from config import settings
from services.llm_service import (
    generate_caption,
    generate_tags,
    generate_product_description,
    visual_question_answer,
)
from services.bg_remover import remove_background
from services.yolo_detector import get_yolo_detector
from PIL import Image
from io import BytesIO

router = APIRouter(prefix="/ai", tags=["AI"])


def _validate_image(file: UploadFile):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Unsupported image type.")


@router.post("/caption")
async def caption_image(file: UploadFile = File(...)):
    _validate_image(file)
    data = await file.read()
    caption = await generate_caption(data)
    return {"caption": caption}


@router.post("/tags")
async def tag_image(file: UploadFile = File(...)):
    _validate_image(file)
    data = await file.read()
    tags = await generate_tags(data)
    return {"tags": tags}


@router.post("/describe")
async def describe_product(file: UploadFile = File(...)):
    _validate_image(file)
    data = await file.read()
    description = await generate_product_description(data)
    return description


@router.post("/vqa")
async def vqa(
    file: UploadFile = File(...),
    question: str = Form(...),
):
    _validate_image(file)
    data = await file.read()
    answer = await visual_question_answer(data, question)
    return {"question": question, "answer": answer}


@router.post("/remove-background")
async def remove_bg(file: UploadFile = File(...)):
    _validate_image(file)
    data = await file.read()
    result = remove_background(data)
    return Response(content=result, media_type="image/png")


@router.post("/detect-objects")
async def detect_objects(file: UploadFile = File(...)):
    _validate_image(file)
    data = await file.read()
    image = Image.open(BytesIO(data)).convert("RGB")
    objects = get_yolo_detector().detect(image)
    return {"objects": objects, "count": len(objects)}
