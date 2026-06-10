import uuid
import json
from datetime import datetime
from agents.base_agent import BaseAgent
from models.database import get_connection

REPORT_PROMPT = """Write an executive summary for a data analysis of {doc_count} document(s) ({doc_types}).

Stats: {entity_count} entities, {fact_count} facts, {conflict_count} conflicts, {insight_count} insights.

Top Insights:
{insights_text}

Top Conflicts:
{conflicts_text}

Write 3 paragraphs (under 300 words total):
1. What was analyzed and its overall quality
2. Most important findings and patterns
3. Key recommended actions

Be specific. Reference actual findings."""


class ReportAgent(BaseAgent):
    name = "ReportAgent"

    def run(self, context: dict) -> dict:
        documents = context.get("documents", [])
        entities = context.get("entities", [])
        facts = context.get("facts", [])
        conflicts = context.get("conflicts", [])
        insights = context.get("insights", [])
        knowledge_graph = context.get("knowledge_graph", {})

        self.thinking("Compiling final analysis report...")

        doc_types = ", ".join(set(d["file_type"] for d in documents))
        insights_text = "\n".join(
            f"- [{i['insight_type'].upper()}] {i['title']}: {i['description'][:100]}"
            for i in insights[:5]
        ) or "None"
        conflicts_text = "\n".join(
            f"- {c['description'][:100]}" for c in conflicts[:3]
        ) or "None"

        self.action("Generating executive summary...")
        try:
            executive_summary = self.stream_llm(
                REPORT_PROMPT.format(
                    doc_count=len(documents),
                    doc_types=doc_types,
                    entity_count=len(entities),
                    fact_count=len(facts),
                    conflict_count=len(conflicts),
                    insight_count=len(insights),
                    insights_text=insights_text,
                    conflicts_text=conflicts_text
                )
            )
        except Exception as e:
            self.error(f"Summary generation failed: {e}")
            executive_summary = "Report generation failed. See the Insights tab for individual findings."

        sections = [
            {
                "title": "Data Overview",
                "content": (
                    f"Analyzed {len(documents)} document(s) of types: {doc_types}. "
                    f"Extracted {len(entities)} unique entities and {len(facts)} factual claims."
                ),
                "stats": {
                    "documents": len(documents),
                    "entities": len(entities),
                    "facts": len(facts),
                    "chunks": context.get("total_chunks", 0)
                }
            },
            {
                "title": "Data Conflicts",
                "content": f"Found {len(conflicts)} data inconsistencies across documents.",
                "items": [{"description": c["description"], "resolution": c.get("resolution", "")} for c in conflicts]
            },
            {
                "title": "Key Insights",
                "content": f"Generated {len(insights)} actionable insights.",
                "items": [
                    {
                        "type": i["insight_type"],
                        "title": i["title"],
                        "description": i["description"],
                        "confidence": i["confidence"],
                        "action": i["recommended_action"]
                    }
                    for i in insights
                ]
            },
            {
                "title": "Knowledge Graph",
                "content": f"Entity graph with {len(knowledge_graph.get('nodes', []))} nodes.",
                "graph": knowledge_graph
            }
        ]

        chart_data = {
            "entity_types": self._count_by(entities, "entity_type"),
            "insight_types": self._count_by(insights, "insight_type"),
            "docs_by_type": self._count_by(documents, "file_type"),
            "conflict_confidence": [c.get("confidence", 0) for c in conflicts]
        }

        report = {
            "id": str(uuid.uuid4()),
            "job_id": self.job_id,
            "executive_summary": executive_summary,
            "sections": json.dumps(sections),
            "chart_data": json.dumps(chart_data),
            "created_at": datetime.utcnow().isoformat()
        }

        conn = get_connection()
        conn.execute(
            """INSERT OR REPLACE INTO reports (id, job_id, executive_summary, sections, chart_data, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (report["id"], report["job_id"], report["executive_summary"],
             report["sections"], report["chart_data"], report["created_at"])
        )
        conn.commit()
        conn.close()

        self.complete(
            "Report ready",
            {"executive_summary_preview": executive_summary[:300]}
        )
        return {**context, "report": report}

    def _count_by(self, items: list, field: str) -> dict:
        counts = {}
        for item in items:
            val = item.get(field, "unknown")
            counts[val] = counts.get(val, 0) + 1
        return counts
