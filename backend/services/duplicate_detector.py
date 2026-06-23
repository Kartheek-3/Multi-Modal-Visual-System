"""
Duplicate Detector — perceptual hashing via imagehash.
"""
from __future__ import annotations

import imagehash
from PIL import Image


SIMILARITY_THRESHOLD = 10  # Hamming distance; lower = more similar


def compute_phash(image: Image.Image) -> str:
    return str(imagehash.phash(image))


def are_duplicates(hash1: str, hash2: str, threshold: int = SIMILARITY_THRESHOLD) -> bool:
    h1 = imagehash.hex_to_hash(hash1)
    h2 = imagehash.hex_to_hash(hash2)
    return (h1 - h2) <= threshold


def hamming_distance(hash1: str, hash2: str) -> int:
    h1 = imagehash.hex_to_hash(hash1)
    h2 = imagehash.hex_to_hash(hash2)
    return h1 - h2
