"""
Demo Dataset Seeder
Downloads a small set of open-license fashion images from Unsplash Source
and indexes them into FAISS + SQLite.

Usage:
    cd backend
    python data/seed_index.py
"""
from __future__ import annotations

import asyncio
import json
import sys
import urllib.request
from pathlib import Path

# Make sure parent package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings
from database import init_db, AsyncSessionLocal
from models.image_metadata import ImageMetadata
from services.clip_encoder import get_clip_encoder
from services.faiss_index import get_faiss_index
from services.color_analyzer import extract_dominant_colors
from services.duplicate_detector import compute_phash
from PIL import Image

# ------------------------------------------------------------------ #
#  Curated seed images (Picsum Photos — free, no API key needed)      #
# ------------------------------------------------------------------ #
SEED_IMAGES = [
    # (id, category, title)
    # Shoes
    (1011, "shoes", "Classic Running Shoes"),
    (1012, "shoes", "Sport Sneakers Blue"),
    (1013, "shoes", "Casual White Sneakers"),
    (1062, "shoes", "Trail Running Boot"),
    (1073, "shoes", "High Top Canvas Shoes"),
    # Watches
    (1, "watches", "Luxury Chronograph Watch"),
    (15, "watches", "Minimalist Black Watch"),
    (16, "watches", "Gold Dress Watch"),
    (20, "watches", "Smart Fitness Watch"),
    (22, "watches", "Vintage Leather Watch"),
    # Bags
    (30, "bags", "Leather Tote Bag"),
    (31, "bags", "Crossbody Mini Bag"),
    (32, "bags", "Backpack Travel Bag"),
    (33, "bags", "Clutch Evening Bag"),
    (34, "bags", "Canvas Shoulder Bag"),
    # Shirts
    (50, "shirts", "White Cotton Shirt"),
    (51, "shirts", "Navy Blue Polo"),
    (52, "shirts", "Striped Oxford Shirt"),
    (53, "shirts", "Casual Linen Shirt"),
    (54, "shirts", "Graphic Print Tee"),
    # Electronics
    (96, "electronics", "Wireless Headphones"),
    (97, "electronics", "Laptop Ultrabook"),
    (98, "electronics", "Smartphone Pro"),
    (99, "electronics", "Smartwatch Fitness"),
    (100, "electronics", "Tablet 11 inch"),
    # Sports
    (200, "sports", "Football Stadium"),
    (201, "sports", "Basketball Court"),
    (202, "sports", "Tennis Racket"),
    (203, "sports", "Cycling Gear"),
    (204, "sports", "Yoga Mat Purple"),
    # Nature / Objects
    (300, "other", "Mountain Landscape"),
    (301, "other", "Ocean Sunset"),
    (302, "other", "City Skyline Night"),
    (303, "other", "Coffee Cup Morning"),
    (304, "other", "Flowers Bouquet"),
    # Fashion
    (400, "shirts", "Summer Dress Floral"),
    (401, "bags", "Designer Handbag Red"),
    (402, "shoes", "Heels Black Stiletto"),
    (403, "watches", "Rose Gold Bracelet Watch"),
    (404, "electronics", "Earbuds Wireless White"),
]


def download_image(picsum_id: int, save_path: Path, size: str = "400/400") -> bool:
    url = f"https://picsum.photos/id/{picsum_id}/{size}"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
        with open(save_path, "wb") as f:
            f.write(data)
        return True
    except Exception as e:
        print(f"  ⚠️  Failed to download id={picsum_id}: {e}")
        return False


async def seed():
    print("🌱 Initialising database...")
    await init_db()

    encoder = get_clip_encoder()
    index = get_faiss_index(dim=encoder.embedding_dim)

    async with AsyncSessionLocal() as db:
        indexed = 0
        for picsum_id, category, title in SEED_IMAGES:
            filename = f"seed_{picsum_id}_{category}.jpg"
            save_path = settings.IMAGE_DIR / filename

            if save_path.exists():
                print(f"  ✓ Already exists: {filename}")
            else:
                print(f"  ↓ Downloading: {title} ({category})...")
                ok = download_image(picsum_id, save_path)
                if not ok:
                    continue

            try:
                image = Image.open(save_path).convert("RGB")
            except Exception as e:
                print(f"  ✗ Cannot open {filename}: {e}")
                continue

            # Check if already in FAISS
            already = any(
                m.get("filename") == filename for m in index.metadata
            )
            if already:
                print(f"  ✓ Already indexed: {filename}")
                continue

            embedding = encoder.encode_image(image)
            colors = extract_dominant_colors(image)
            phash = compute_phash(image)
            url = f"/static/images/{filename}"
            width, height = image.size

            meta = {
                "db_id": "",
                "filename": filename,
                "url": url,
                "filepath": str(save_path),
                "category": category,
                "title": title,
                "tags": json.dumps([category, title.lower().replace(" ", ""), "product"]),
                "dominant_colors": json.dumps(colors),
                "phash": phash,
            }
            faiss_id = index.add(embedding, meta)

            img_record = ImageMetadata(
                filename=filename,
                filepath=str(save_path),
                url=url,
                title=title,
                category=category,
                tags=json.dumps([category, title.lower().replace(" ", ""), "product"]),
                dominant_colors=json.dumps(colors),
                phash=phash,
                width=width,
                height=height,
                file_size=save_path.stat().st_size,
                faiss_id=faiss_id,
            )
            db.add(img_record)
            await db.commit()
            await db.refresh(img_record)

            index.metadata[faiss_id]["db_id"] = img_record.id
            indexed += 1
            print(f"  ✅ Indexed: {title} → faiss_id={faiss_id}")

        index.save()
        print(f"\n🎉 Done! Indexed {indexed} new images. Total in FAISS: {index.total()}")


if __name__ == "__main__":
    asyncio.run(seed())
