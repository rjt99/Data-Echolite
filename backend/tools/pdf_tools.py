import pdfplumber
import io
import base64
from PIL import Image

try:
    from pypdf import PdfReader
    _PYPDF_AVAILABLE = True
except ImportError:
    _PYPDF_AVAILABLE = False


def extract_text_from_pdf(file_path: str) -> list:
    """Returns list of {page, text, has_images, image_count}"""
    pages = []
    with pdfplumber.open(file_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = (page.extract_text() or "").strip()
            image_count = len(page.images)
            pages.append({
                "page": page_num + 1,
                "text": text,
                "has_images": image_count > 0,
                "image_count": image_count,
            })
    return pages


def extract_tables_from_pdf(file_path: str) -> list:
    """Returns list of {page, rows, text_repr}"""
    tables = []
    with pdfplumber.open(file_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            extracted = page.extract_tables()
            for table in extracted:
                if table:
                    tables.append({
                        "page": page_num + 1,
                        "rows": table,
                        "text_repr": "\n".join(
                            [" | ".join([str(c or "") for c in row]) for row in table]
                        )
                    })
    return tables


def extract_images_from_pdf(file_path: str) -> list:
    """Returns list of {page, index, b64, mime} — uses pypdf if available."""
    if not _PYPDF_AVAILABLE:
        return []

    images = []
    reader = PdfReader(file_path)
    for page_num, page in enumerate(reader.pages):
        for img_idx, img_obj in enumerate(page.images):
            try:
                image_bytes = img_obj.data
                ext = (img_obj.name.rsplit(".", 1)[-1].lower()
                       if "." in img_obj.name else "png")

                img = Image.open(io.BytesIO(image_bytes))
                if img.width > 1024 or img.height > 1024:
                    img.thumbnail((1024, 1024))
                    buf = io.BytesIO()
                    fmt = "PNG" if ext not in ("jpg", "jpeg", "png") else ext.upper().replace("JPG", "JPEG")
                    img.save(buf, format=fmt)
                    image_bytes = buf.getvalue()
                    ext = "png"

                b64 = base64.b64encode(image_bytes).decode("utf-8")
                mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"

                images.append({
                    "page": page_num + 1,
                    "index": img_idx,
                    "b64": b64,
                    "mime": mime,
                })
            except Exception:
                continue

    return images
