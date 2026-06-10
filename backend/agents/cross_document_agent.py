import uuid
import json
from agents.base_agent import BaseAgent
from services.llm_service import simple_llm_call
from models.database import save_conflict
from rapidfuzz import fuzz

CONFLICT_PROMPT = """Two sources report different values for the same fact:

Source A ({doc_a}): {subject} {attribute} = {value_a}
Source B ({doc_b}): {subject} {attribute} = {value_b}

Respond as JSON: {{"resolution": "...", "likely_correct": "A or B or both", "confidence": 0-1, "reasoning": "..."}}"""


class CrossDocumentAgent(BaseAgent):
    name = "CrossDocumentAgent"

    def run(self, context: dict) -> dict:
        facts = context.get("facts", [])
        documents = context.get("documents", [])

        if len(documents) < 2:
            self.thinking("Single document — skipping cross-document comparison")
            self.complete("No cross-document mapping needed")
            return {**context, "conflicts": [], "overlaps": []}

        self.thinking(f"Comparing {len(facts)} facts across {len(documents)} documents...")

        conflicts = []
        overlaps = []

        # Group facts by (subject, attribute)
        fact_groups = {}
        for fact in facts:
            key = f"{fact['subject'].lower()}::{fact['attribute'].lower()}"
            fact_groups.setdefault(key, []).append(fact)

        self.action(f"Checking {len(fact_groups)} fact dimensions for conflicts...")

        for key, group in fact_groups.items():
            if len(group) < 2:
                continue

            # Collect values per source
            source_values = {}
            for fact in group:
                src = fact.get("source_doc", "unknown")
                source_values.setdefault(src, []).append(fact)

            if len(source_values) < 2:
                continue

            sources = list(source_values.keys())
            for i in range(len(sources)):
                for j in range(i + 1, len(sources)):
                    val_a = source_values[sources[i]][0]["value"]
                    val_b = source_values[sources[j]][0]["value"]
                    similarity = fuzz.ratio(str(val_a).lower(), str(val_b).lower())

                    if similarity > 90:
                        overlaps.append({
                            "subject": group[0]["subject"],
                            "attribute": group[0]["attribute"],
                            "sources": [sources[i], sources[j]],
                            "value": val_a,
                            "type": "confirmed"
                        })
                    else:
                        self.action(
                            f"Conflict: '{group[0]['subject']} {group[0]['attribute']}' "
                            f"— '{sources[i]}' vs '{sources[j]}'"
                        )
                        resolution_data = {"resolution": "Manual review required", "confidence": 0.5}
                        try:
                            raw = simple_llm_call(
                                CONFLICT_PROMPT.format(
                                    doc_a=sources[i], doc_b=sources[j],
                                    subject=group[0]["subject"],
                                    attribute=group[0]["attribute"],
                                    value_a=val_a, value_b=val_b
                                )
                            )
                            start = raw.find("{")
                            end = raw.rfind("}") + 1
                            if start >= 0 and end > start:
                                text = raw[start:end]
                                try:
                                    resolution_data = json.loads(text)
                                except json.JSONDecodeError:
                                    cleaned = re.sub(r',\s*([}\]])', r'\1', text)
                                    cleaned = re.sub(r'(?<!\\)\n', ' ', cleaned)
                                    resolution_data = json.loads(cleaned)
                        except Exception:
                            pass

                        conflict = {
                            "id": str(uuid.uuid4()),
                            "job_id": self.job_id,
                            "fact_a_id": source_values[sources[i]][0]["id"],
                            "fact_b_id": source_values[sources[j]][0]["id"],
                            "conflict_type": "value_mismatch",
                            "description": (
                                f"'{group[0]['subject']} {group[0]['attribute']}': "
                                f"'{sources[i]}' says '{val_a}', '{sources[j]}' says '{val_b}'"
                            ),
                            "resolution": resolution_data.get("resolution", ""),
                            "confidence": float(resolution_data.get("confidence", 0.5))
                        }
                        conflicts.append(conflict)
                        save_conflict(conflict)
                        self.result(
                            f"Conflict: {conflict['description'][:80]}",
                            {"resolution": resolution_data.get("resolution", "")}
                        )

        self.complete(
            f"Found {len(conflicts)} conflicts, {len(overlaps)} confirmed overlaps",
            {"conflict_count": len(conflicts), "overlap_count": len(overlaps)}
        )
        return {**context, "conflicts": conflicts, "overlaps": overlaps}
