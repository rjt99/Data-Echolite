import os

# ── LLM / OpenRouter ──────────────────────────────────────────────────────────
OPENROUTER_API_KEY  = "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"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
TEXT_MODEL          = "openai/gpt-oss-120b:free"
VISION_MODEL        = "google/gemma-4-31b-it:free"

# ── Flask ─────────────────────────────────────────────────────────────────────
FLASK_SECRET_KEY = "change_this_random"

# ── Storage paths ─────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER   = os.path.join(BASE_DIR, "uploads")
DATA_FOLDER     = os.path.join(BASE_DIR, "data")
CHROMA_DB_PATH  = os.path.join(DATA_FOLDER, "chroma_db")
SQLITE_DB_PATH  = os.path.join(DATA_FOLDER, "insights.db")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER,   exist_ok=True)
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

# ── Upload / chunking settings ────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {
    "pdf", "docx", "doc", "pptx", "ppt",
    "csv", "json", "xlsx", "xls",
    "png", "jpg", "jpeg", "gif", "bmp", "tiff",
    "mp4", "avi", "mov", "mkv", "webm",
    "txt", "md"
}

MAX_CHUNK_SIZE  = 1000
CHUNK_OVERLAP   = 200
TOP_K_RETRIEVAL = 5
