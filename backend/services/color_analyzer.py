"""
Color Analyzer Service
Extracts dominant colors from an image using K-Means clustering.
"""
from __future__ import annotations

import numpy as np
from PIL import Image
from sklearn.cluster import KMeans


NAMED_COLORS = {
    "red": (220, 50, 50),
    "blue": (50, 100, 220),
    "green": (50, 180, 80),
    "black": (20, 20, 20),
    "white": (240, 240, 240),
    "yellow": (240, 200, 50),
    "orange": (240, 130, 50),
    "purple": (130, 50, 200),
    "pink": (240, 150, 180),
    "gray": (150, 150, 150),
    "brown": (140, 80, 40),
    "beige": (210, 190, 160),
    "navy": (30, 50, 120),
    "teal": (50, 160, 160),
    "gold": (200, 165, 50),
    "silver": (180, 180, 185),
}


def _rgb_to_hex(rgb: tuple) -> str:
    return "#{:02x}{:02x}{:02x}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))


def _nearest_name(hex_color: str) -> str:
    """Map a hex color to the nearest named color."""
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    best_name, best_dist = "unknown", float("inf")
    for name, (nr, ng, nb) in NAMED_COLORS.items():
        dist = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2
        if dist < best_dist:
            best_dist, best_name = dist, name
    return best_name


def extract_dominant_colors(image: Image.Image, n_colors: int = 5) -> list[dict]:
    """Return top-n dominant colors as list of {hex, name, percentage}."""
    img = image.convert("RGB").resize((150, 150))
    pixels = np.array(img).reshape(-1, 3).astype(float)

    km = KMeans(n_clusters=n_colors, n_init=5, random_state=42)
    km.fit(pixels)

    counts = np.bincount(km.labels_)
    total = len(pixels)
    results = []
    for i in np.argsort(-counts)[:n_colors]:
        hex_c = _rgb_to_hex(km.cluster_centers_[i])
        results.append({
            "hex": hex_c,
            "name": _nearest_name(hex_c),
            "percentage": round(float(counts[i]) / total * 100, 1),
        })
    return results


def color_matches_query(dominant_colors: list[dict], color_query: str) -> bool:
    """Check if any dominant color matches the query string."""
    q = color_query.lower()
    for c in dominant_colors:
        if q in c["name"] or q in c["hex"]:
            return True
    return False
