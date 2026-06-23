"""
FAISS Index Service
Manages building, persisting, and querying the FAISS flat IP index.
Uses a flat inner-product index (equiv. to cosine similarity on L2-normalised vecs).
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import faiss
import numpy as np

from config import settings

logger = logging.getLogger(__name__)

_INDEX_PATH = Path(settings.FAISS_INDEX_PATH)
_META_PATH = Path(settings.FAISS_META_PATH)


class FAISSIndex:
    def __init__(self, dim: int = 512):
        self.dim = dim
        self.index: faiss.IndexFlatIP | None = None
        self.metadata: list[dict[str, Any]] = []  # parallel list with FAISS vectors
        self._load_or_create()

    # ------------------------------------------------------------------ #
    #  Persistence                                                         #
    # ------------------------------------------------------------------ #

    def _load_or_create(self):
        if _INDEX_PATH.exists() and _META_PATH.exists():
            logger.info("Loading existing FAISS index from disk...")
            self.index = faiss.read_index(str(_INDEX_PATH))
            with open(_META_PATH, "r") as f:
                self.metadata = json.load(f)
            logger.info(f"Loaded index with {self.index.ntotal} vectors.")
        else:
            logger.info("Creating new FAISS index...")
            self.index = faiss.IndexFlatIP(self.dim)
            self.metadata = []

    def save(self):
        _INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(_INDEX_PATH))
        with open(_META_PATH, "w") as f:
            json.dump(self.metadata, f)
        logger.info(f"Saved FAISS index ({self.index.ntotal} vectors).")

    # ------------------------------------------------------------------ #
    #  CRUD                                                                #
    # ------------------------------------------------------------------ #

    def add(self, embedding: np.ndarray, meta: dict[str, Any]) -> int:
        """Add a single vector and return its FAISS ID (row index)."""
        embedding = embedding.reshape(1, -1).astype(np.float32)
        faiss_id = self.index.ntotal
        self.index.add(embedding)
        self.metadata.append({**meta, "faiss_id": faiss_id})
        return faiss_id

    def add_batch(self, embeddings: np.ndarray, metas: list[dict]) -> list[int]:
        """Add multiple vectors at once."""
        embeddings = embeddings.astype(np.float32)
        start_id = self.index.ntotal
        self.index.add(embeddings)
        ids = []
        for i, meta in enumerate(metas):
            fid = start_id + i
            self.metadata.append({**meta, "faiss_id": fid})
            ids.append(fid)
        return ids

    # ------------------------------------------------------------------ #
    #  Search                                                              #
    # ------------------------------------------------------------------ #

    def search(
        self,
        query: np.ndarray,
        top_k: int = 20,
        category: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Return top_k results as list of dicts with 'score' and metadata.
        If category is given, returns more candidates and then post-filters.
        """
        if self.index.ntotal == 0:
            return []

        fetch_k = min(max(top_k * 5, 100), self.index.ntotal)
        query = query.reshape(1, -1).astype(np.float32)
        scores, ids = self.index.search(query, fetch_k)

        results = []
        for score, idx in zip(scores[0], ids[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            meta = self.metadata[idx]
            if category and meta.get("category", "").lower() != category.lower():
                continue
            results.append({**meta, "score": float(score)})
            if len(results) >= top_k:
                break
        return results

    def get_by_faiss_id(self, faiss_id: int) -> dict | None:
        if 0 <= faiss_id < len(self.metadata):
            return self.metadata[faiss_id]
        return None

    def total(self) -> int:
        return self.index.ntotal if self.index else 0


# Singleton
_faiss_instance: FAISSIndex | None = None


def get_faiss_index(dim: int = 512) -> FAISSIndex:
    global _faiss_instance
    if _faiss_instance is None:
        _faiss_instance = FAISSIndex(dim=dim)
    return _faiss_instance
