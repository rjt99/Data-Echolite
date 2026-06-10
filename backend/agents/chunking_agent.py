import uuid
from datetime import datetime
from agents.base_agent import BaseAgent
from services.vector_store import add_chunks
from models.database import get_connection


class ChunkingAgent(BaseAgent):
    name = "ChunkingAgent"

    def run(self, context: dict) -> dict:
        parsed_docs = context.get("parsed_docs", [])
        all_chunks = []

        self.thinking("Preparing content for vector embedding...")

        for doc in parsed_docs:
            text_blocks = [
                b for b in doc.get("blocks", [])
                if b["type"] in ("text", "table") and b.get("content", "").strip()
            ]
            self.action(f"Embedding {len(text_blocks)} blocks from '{doc['filename']}'")

            for block in text_blocks:
                chunk_id = str(uuid.uuid4())
                metadata = {
                    "doc_id": doc["doc_id"],
                    "filename": doc["filename"],
                    "file_type": doc["file_type"],
                    "page": str(block.get("page", "")),
                    "block_type": block["type"],
                    "derived_from": block.get("derived_from", "original"),
                }
                all_chunks.append({
                    "id": chunk_id,
                    "content": block["content"],
                    "metadata": metadata
                })

                conn = get_connection()
                conn.execute(
                    """INSERT OR IGNORE INTO chunks
                       (id, doc_id, job_id, content, chunk_type, page_number, metadata, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (chunk_id, doc["doc_id"], self.job_id,
                     block["content"], block["type"],
                     block.get("page", 0), str(metadata),
                     datetime.utcnow().isoformat())
                )
                conn.commit()
                conn.close()

        self.progress(f"Embedding {len(all_chunks)} chunks into ChromaDB...", 50)

        batch_size = 50
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i:i + batch_size]
            add_chunks(self.job_id, batch)
            done = min(i + batch_size, len(all_chunks))
            pct = int(50 + 50 * (done / max(len(all_chunks), 1)))
            self.progress(f"Embedded {done}/{len(all_chunks)} chunks", pct)

        self.complete(
            f"Stored {len(all_chunks)} chunks in vector DB",
            {"total_chunks": len(all_chunks)}
        )
        return {**context, "total_chunks": len(all_chunks)}
