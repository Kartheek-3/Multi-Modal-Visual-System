"""
LLM Service — Gemini 1.5 Flash
Handles: captions, VQA, smart tagging, product descriptions,
         natural language intent extraction, RAG explanations.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import re
from io import BytesIO
from pathlib import Path

import google.generativeai as genai
from PIL import Image

from config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel(settings.GEMINI_MODEL)


def _strip_code_fence(text: str) -> str:
    """Remove markdown code fences (```json ... ```) from LLM output."""
    text = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if match:
        return match.group(1).strip()
    return text


def _pil_to_part(image: Image.Image) -> dict:
    buf = BytesIO()
    image.save(buf, format="JPEG")
    return {
        "inline_data": {
            "mime_type": "image/jpeg",
            "data": base64.b64encode(buf.getvalue()).decode(),
        }
    }


def _bytes_to_pil(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data)).convert("RGB")


# ------------------------------------------------------------------ #
#  Caption                                                             #
# ------------------------------------------------------------------ #

async def generate_caption(image_bytes: bytes) -> str:
    img = _bytes_to_pil(image_bytes)
    prompt = (
        "Generate a concise, descriptive caption for this image in one sentence. "
        "Focus on the main subject, colors, and any notable features."
    )
    response = await asyncio.to_thread(_model.generate_content, [prompt, _pil_to_part(img)])
    return response.text.strip()


# ------------------------------------------------------------------ #
#  Smart Tagging                                                       #
# ------------------------------------------------------------------ #

async def generate_tags(image_bytes: bytes) -> list[str]:
    img = _bytes_to_pil(image_bytes)
    prompt = (
        "Generate 8-12 relevant tags for this image. "
        "Return ONLY a JSON array of lowercase strings, no explanation. "
        'Example: ["shoe", "sports", "running", "black", "nike"]'
    )
    response = await asyncio.to_thread(_model.generate_content, [prompt, _pil_to_part(img)])
    text = _strip_code_fence(response.text)
    try:
        return json.loads(text)
    except Exception:
        return [t.strip().strip('"') for t in text.strip("[]").split(",") if t.strip()]


# ------------------------------------------------------------------ #
#  Product Description                                                 #
# ------------------------------------------------------------------ #

async def generate_product_description(image_bytes: bytes) -> dict:
    img = _bytes_to_pil(image_bytes)
    prompt = """Analyze this product image and return a JSON object with:
{
  "name": "Product name",
  "description": "2-3 sentence product description",
  "category": "one of: shoes, watches, bags, shirts, electronics, other",
  "keywords": ["keyword1", "keyword2", ...],
  "features": ["feature1", "feature2", ...]
}
Return ONLY the JSON, no explanation."""
    response = await asyncio.to_thread(_model.generate_content, [prompt, _pil_to_part(img)])
    text = _strip_code_fence(response.text)
    try:
        return json.loads(text)
    except Exception:
        return {"name": "Unknown Product", "description": text, "category": "other", "keywords": [], "features": []}


# ------------------------------------------------------------------ #
#  Visual Question Answering                                           #
# ------------------------------------------------------------------ #

async def visual_question_answer(image_bytes: bytes, question: str) -> str:
    img = _bytes_to_pil(image_bytes)
    prompt = f"Answer this question about the image concisely and accurately: {question}"
    response = await asyncio.to_thread(_model.generate_content, [prompt, _pil_to_part(img)])
    return response.text.strip()


# ------------------------------------------------------------------ #
#  Natural Language Intent Extraction                                  #
# ------------------------------------------------------------------ #

async def extract_search_intent(nl_query: str) -> dict:
    prompt = f"""Extract structured search intent from this natural language query:
"{nl_query}"

Return ONLY a JSON object:
{{
  "text_query": "simplified search keywords",
  "category": "shoes|watches|bags|shirts|electronics|null",
  "color": "color name or null",
  "price_max": number_or_null,
  "attributes": ["attribute1", "attribute2"],
  "original_query": "{nl_query}"
}}"""
    response = await asyncio.to_thread(_model.generate_content, prompt)
    text = _strip_code_fence(response.text)
    try:
        return json.loads(text)
    except Exception:
        return {"text_query": nl_query, "category": None, "color": None, "price_max": None, "attributes": [], "original_query": nl_query}


# ------------------------------------------------------------------ #
#  RAG Explanation                                                      #
# ------------------------------------------------------------------ #

async def rag_explain_results(query: str, results: list[dict]) -> str:
    context_lines = []
    for i, r in enumerate(results[:5], 1):
        desc = r.get("description") or r.get("caption") or r.get("title") or "Unknown"
        score = r.get("score", 0)
        tags = r.get("tags", "")
        context_lines.append(f"{i}. {desc} (similarity: {score:.2%}, tags: {tags})")
    context = "\n".join(context_lines)

    prompt = f"""You are a visual search assistant. The user searched for: "{query}"

Top results found:
{context}

Explain in 2-3 sentences why these results match the query, mentioning:
- Shape or style similarity
- Color similarity  
- Category match
Keep it friendly and informative."""
    response = await asyncio.to_thread(_model.generate_content, prompt)
    return response.text.strip()
