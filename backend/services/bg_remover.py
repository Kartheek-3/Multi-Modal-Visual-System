"""
Background Removal Service — rembg
"""
from __future__ import annotations

from io import BytesIO

from PIL import Image
from rembg import remove


def remove_background(image_bytes: bytes) -> bytes:
    """Return PNG bytes with background removed."""
    output = remove(image_bytes)
    return output


def remove_background_pil(image: Image.Image) -> Image.Image:
    buf = BytesIO()
    image.save(buf, format="PNG")
    result_bytes = remove(buf.getvalue())
    return Image.open(BytesIO(result_bytes)).convert("RGBA")
