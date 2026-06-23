"""
YOLOv8 Object Detector
"""
from __future__ import annotations

import logging
from functools import lru_cache
from io import BytesIO

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class YOLODetector:
    def __init__(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO("yolov8n.pt")   # nano — fast, small download
            self.available = True
            logger.info("YOLOv8 loaded successfully.")
        except Exception as e:
            logger.warning(f"YOLOv8 not available: {e}")
            self.model = None
            self.available = False

    def detect(self, image: Image.Image) -> list[dict]:
        """Return list of detected objects with label, confidence, bbox."""
        if not self.available:
            return []
        img_array = np.array(image.convert("RGB"))
        results = self.model(img_array, verbose=False)
        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "label": r.names[int(box.cls)],
                    "confidence": round(float(box.conf), 3),
                    "bbox": [round(float(x), 1) for x in box.xyxy[0].tolist()],
                })
        # Sort by confidence descending
        detections.sort(key=lambda x: -x["confidence"])
        return detections

    def detect_bytes(self, data: bytes) -> list[dict]:
        image = Image.open(BytesIO(data)).convert("RGB")
        return self.detect(image)


@lru_cache(maxsize=1)
def get_yolo_detector() -> YOLODetector:
    return YOLODetector()
