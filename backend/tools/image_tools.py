import base64
import io
import cv2
import numpy as np
from PIL import Image


def load_and_encode_image(file_path: str, max_size: int = 1024) -> tuple:
    """Returns (b64_string, mime_type)"""
    img = Image.open(file_path).convert("RGB")
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return b64, "image/jpeg"


def preprocess_for_ocr(file_path: str) -> np.ndarray:
    """Denoise and prepare image for better text extraction."""
    img = cv2.imread(file_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    return denoised
