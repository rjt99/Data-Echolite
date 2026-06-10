import threading
from services.streaming import event_bus, StreamEvent
from models.database import update_job_status

from agents.ingestion_agent import IngestionAgent
from agents.document_parser_agent import DocumentParserAgent
from agents.chunking_agent import ChunkingAgent
from agents.entity_extraction_agent import EntityExtractionAgent
from agents.cross_document_agent import CrossDocumentAgent
from agents.knowledge_graph_agent import KnowledgeGraphAgent
from agents.insight_agent import InsightAgent
from agents.report_agent import ReportAgent

# Vision and Video agents are disabled — image/video processing
# requires torch/opencv which need VC++ redistributable (not available).
# Only text/PDF mode is active.


class Orchestrator:
    def __init__(self, job_id: str):
        self.job_id = job_id

    def _emit(self, event_type: str, content: str, data: dict = None):
        event = StreamEvent("Orchestrator", event_type, content, data or {})
        event_bus.publish(self.job_id, event)

    def run(self, files: list):
        try:
            self._emit("thinking", f"Starting pipeline for {len(files)} file(s)...")

            multi_doc = len(files) > 1
            context = {"files": files, "job_id": self.job_id}

            # Stage 1 — Ingest
            self._emit("progress", "Stage 1/8: Ingesting files...", {"stage": 1, "total": 8})
            context = IngestionAgent(self.job_id).run(context)

            # Stage 2 — Parse documents
            self._emit("progress", "Stage 2/8: Parsing documents...", {"stage": 2, "total": 8})
            context = DocumentParserAgent(self.job_id).run(context)

            # Stage 3 — Vision (disabled in text/PDF mode)
            self._emit("action", "Skipping vision stage (text/PDF mode only)")

            # Stage 4 — Video (disabled in text/PDF mode)
            self._emit("action", "Skipping video stage (text/PDF mode only)")

            # Stage 5 — Chunk + Embed
            self._emit("progress", "Stage 5/8: Embedding content into vector DB...", {"stage": 5, "total": 8})
            context = ChunkingAgent(self.job_id).run(context)

            # Stage 6 — Entity + Fact Extraction
            self._emit("progress", "Stage 6/8: Extracting entities and facts...", {"stage": 6, "total": 8})
            context = EntityExtractionAgent(self.job_id).run(context)

            # Stage 7 — Cross-document analysis
            if multi_doc:
                self._emit("progress", "Stage 7/8: Cross-document conflict detection...", {"stage": 7, "total": 8})
                context = CrossDocumentAgent(self.job_id).run(context)
            else:
                self._emit("action", "Single document — skipping cross-document mapping")
                context = {**context, "conflicts": [], "overlaps": []}

            context = KnowledgeGraphAgent(self.job_id).run(context)

            # Stage 8 — Insights + Report
            self._emit("progress", "Stage 8/8: Generating insights and report...", {"stage": 8, "total": 8})
            context = InsightAgent(self.job_id).run(context)
            context = ReportAgent(self.job_id).run(context)

            update_job_status(self.job_id, "completed")
            self._emit("complete", "Pipeline complete — all insights are ready!", {"job_id": self.job_id})

        except Exception as e:
            update_job_status(self.job_id, "failed", str(e))
            self._emit("error", f"Pipeline failed: {e}")
        finally:
            event_bus.close(self.job_id)

    def run_async(self, files: list) -> threading.Thread:
        t = threading.Thread(target=self.run, args=(files,), daemon=True)
        t.start()
        return t
