import os
import uuid
import mimetypes
from agents.base_agent import BaseAgent
from models.database import save_document

MIME_TO_TYPE = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.ms-powerpoint": "pptx",
    "text/csv": "csv",
    "application/json": "json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xlsx",
    "text/plain": "txt",
    "image/png": "image", "image/jpeg": "image",
    "image/gif": "image", "image/bmp": "image", "image/tiff": "image",
    "video/mp4": "video", "video/avi": "video",
    "video/quicktime": "video", "video/x-matroska": "video", "video/webm": "video",
}

EXT_TO_TYPE = {
    "pdf": "pdf", "docx": "docx", "doc": "docx",
    "pptx": "pptx", "ppt": "pptx", "csv": "csv",
    "json": "json", "xlsx": "xlsx", "xls": "xlsx",
    "txt": "txt", "md": "txt",
    "png": "image", "jpg": "image", "jpeg": "image",
    "gif": "image", "bmp": "image", "tiff": "image",
    "mp4": "video", "avi": "video", "mov": "video",
    "mkv": "video", "webm": "video",
}


def detect_file_type(file_path: str) -> str:
    mime, _ = mimetypes.guess_type(file_path)
    if mime and mime in MIME_TO_TYPE:
        return MIME_TO_TYPE[mime]
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    return EXT_TO_TYPE.get(ext, "unknown")


class IngestionAgent(BaseAgent):
    name = "IngestionAgent"

    def run(self, context: dict) -> dict:
        files = context.get("files", [])
        self.thinking(f"Inspecting {len(files)} uploaded file(s)...")

        documents = []
        for file_path in files:
            filename = os.path.basename(file_path)
            file_type = detect_file_type(file_path)
            self.action(f"'{filename}' detected as: {file_type}")

            doc = {
                "id": str(uuid.uuid4()),
                "job_id": self.job_id,
                "filename": filename,
                "file_type": file_type,
                "file_path": file_path,
            }
            save_document(doc)
            documents.append(doc)

        self.complete(
            f"Ingested {len(documents)} document(s)",
            {"documents": [{"id": d["id"], "filename": d["filename"], "type": d["file_type"]} for d in documents]}
        )
        return {**context, "documents": documents}
