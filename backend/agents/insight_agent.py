import uuid
import json
import re
from agents.base_agent import BaseAgent
from models.database import save_insight


def _extract_json_array(raw: str) -> list:
    """Parse a JSON array from LLM output using multiple fallback strategies."""
    # Strategy 1: find outermost [...] and parse directly
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        text = match.group()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Strategy 2: clean common LLM formatting issues then retry
        cleaned = re.sub(r',\s*([}\]])', r'\1', text)          # trailing commas
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', cleaned)  # control chars
        cleaned = re.sub(r'(?<!\\)\n', ' ', cleaned)            # bare newlines inside strings
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

    # Strategy 3: extract individual {...} objects one by one
    objects = []
    depth, start = 0, None
    for i, ch in enumerate(raw):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                try:
                    objects.append(json.loads(raw[start:i + 1]))
                except json.JSONDecodeError:
                    pass
                start = None
    return objects

INSIGHT_PROMPT = """You are an expert data analyst. Based on the following data extracted from {doc_count} document(s), generate the top 5 most surprising and actionable insights.

ENTITIES: {entities_summary}

KEY FACTS:
{facts_summary}

DATA CONFLICTS:
{conflicts_summary}

DOCUMENT TYPES: {doc_types}

Return ONLY a JSON array:
[{{
  "insight_type": "contradiction|pattern|gap|trend|risk|discovery",
  "title": "Short title",
  "description": "Detailed description",
  "evidence": ["evidence 1", "evidence 2"],
  "confidence": 0.0-1.0,
  "recommended_action": "What to do about this"
}}]"""


class InsightAgent(BaseAgent):
    name = "InsightAgent"

    def run(self, context: dict) -> dict:
        entities = context.get("entities", [])
        facts = context.get("facts", [])
        conflicts = context.get("conflicts", [])
        documents = context.get("documents", [])

        self.thinking("Synthesizing insights from extracted knowledge...")

        entities_summary = ", ".join(e["canonical_name"] for e in entities[:20]) or "None"
        facts_summary = "\n".join(
            f"- {f['subject']} {f['attribute']}: {f['value']}" for f in facts[:15]
        ) or "None"
        conflicts_summary = "\n".join(c["description"] for c in conflicts[:10]) or "None"
        doc_types = ", ".join(set(d["file_type"] for d in documents)) or "unknown"

        self.action("Calling LLM for insight synthesis...")
        insights = []

        try:
            raw = self.stream_llm(
                INSIGHT_PROMPT.format(
                    doc_count=len(documents),
                    entities_summary=entities_summary,
                    facts_summary=facts_summary,
                    conflicts_summary=conflicts_summary,
                    doc_types=doc_types
                ),
                system="Return only a valid JSON array."
            )
            insights_raw = _extract_json_array(raw)
            if insights_raw:
                for item in insights_raw:
                    if not isinstance(item, dict):
                        continue
                    insight = {
                        "id": str(uuid.uuid4()),
                        "job_id": self.job_id,
                        "insight_type": item.get("insight_type", "discovery"),
                        "title": item.get("title", "Insight"),
                        "description": item.get("description", ""),
                        "evidence": item.get("evidence", []),
                        "confidence": float(item.get("confidence", 0.8)),
                        "recommended_action": item.get("recommended_action", "")
                    }
                    insights.append(insight)
                    save_insight(insight)
                    self.result(
                        f"[{insight['insight_type'].upper()}] {insight['title']}",
                        {"confidence": insight["confidence"]}
                    )
        except Exception as e:
            self.error(f"Insight synthesis failed: {e}")

        # Always add conflict-derived insights
        for conflict in conflicts[:3]:
            insight = {
                "id": str(uuid.uuid4()),
                "job_id": self.job_id,
                "insight_type": "contradiction",
                "title": "Data Inconsistency Detected",
                "description": conflict["description"],
                "evidence": [conflict.get("resolution", "")],
                "confidence": float(conflict.get("confidence", 0.7)),
                "recommended_action": "Verify source data and resolve discrepancy"
            }
            insights.append(insight)
            save_insight(insight)

        self.complete(
            f"Generated {len(insights)} insights",
            {"insights": [{"title": i["title"], "type": i["insight_type"]} for i in insights]}
        )
        return {**context, "insights": insights}
