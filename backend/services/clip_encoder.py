"""
CLIP Encoder Service
Wraps open_clip to produce L2-normalized embeddings for images and text.
Thread-safe singleton — loaded once on startup.
"""
from __future__ import annotations

import io
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
import open_clip
import torch
from PIL import Image

from config import settings

logger = logging.getLogger(__name__)


class CLIPEncoder:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading CLIP model {settings.CLIP_MODEL} on {self.device}...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            settings.CLIP_MODEL, pretrained=settings.CLIP_PRETRAINED
        )
        self.tokenizer = open_clip.get_tokenizer(settings.CLIP_MODEL)
        self.model.eval()
        self.model.to(self.device)
        self.embedding_dim = self.model.visual.output_dim
        logger.info(f"CLIP loaded. Embedding dim: {self.embedding_dim}")

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Return L2-normalized float32 embedding for a PIL image."""
        img_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            features = self.model.encode_image(img_tensor)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy().astype(np.float32)

    def encode_image_bytes(self, data: bytes) -> np.ndarray:
        image = Image.open(io.BytesIO(data)).convert("RGB")
        return self.encode_image(image)

    def encode_image_path(self, path: str | Path) -> np.ndarray:
        image = Image.open(path).convert("RGB")
        return self.encode_image(image)

    def encode_text(self, text: str) -> np.ndarray:
        """Return L2-normalized float32 embedding for a text query."""
        tokens = self.tokenizer([text]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy().astype(np.float32)

    def encode_hybrid(
        self, image: Image.Image, text: str, alpha: float = 0.5
    ) -> np.ndarray:
        """
        Weighted combination of image + text embeddings.
        alpha=0.5 means equal weight; alpha=1.0 means image-only.
        """
        img_emb = self.encode_image(image)
        txt_emb = self.encode_text(text)
        combined = alpha * img_emb + (1 - alpha) * txt_emb
        combined = combined / np.linalg.norm(combined, axis=-1, keepdims=True)
        return combined.astype(np.float32)


@lru_cache(maxsize=1)
def get_clip_encoder() -> CLIPEncoder:
    return CLIPEncoder()
