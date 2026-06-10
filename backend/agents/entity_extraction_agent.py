import uuid
import json
import re
from agents.base_agent import BaseAgent
from services.llm_service import simple_llm_call
from models.database import save_entity, save_fact
from rapidfuzz import fuzz


def _extract_json_array(raw: str) -> list:
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        text = match.group()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        cleaned = re.sub(r',\s*([}\]])', r'\1', text)
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', cleaned)
        cleaned = re.sub(r'(?<!\\)\n', ' ', cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass
    objects, depth, start = [], 0, None
    for i, ch in enumerate(raw):
        if ch == '{':
            if depth == 0: start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                try: objects.append(json.loads(raw[start:i + 1]))
                except json.JSONDecodeError: pass
                start = None
    return objects

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except Exception:
    SPACY_AVAILABLE = False

FACT_EXTRACTION_PROMPT = """Extract factual claims from the text below as a JSON array.
Each fact: {{"subject": "...", "attribute": "...", "value": "...", "date_ref": "...", "confidence": 0-1}}
Focus on numbers, statistics, named entities, specific claims, and dates.
Return ONLY a valid JSON array.

Text:
{text}

JSON:"""


class EntityExtractionAgent(BaseAgent):
    name = "EntityExtractionAgent"

    def run(self, context: dict) -> dict:
        parsed_docs = context.get("parsed_docs", [])
        all_entities = {}
        all_facts = []

        self.thinking("Extracting entities and facts from all documents...")

        for doc in parsed_docs:
            text_blocks = [
                b for b in doc.get("blocks", [])
                if b["type"] in ("text", "table") and b.get("content", "").strip()
            ]
            if not text_blocks:
                continue

            full_text = "\n".join(b["content"] for b in text_blocks[:20])
            self.action(f"Extracting from '{doc['filename']}'")

            # spaCy NER
            if SPACY_AVAILABLE:
                try:
                    doc_nlp = nlp(full_text[:100000])
                    for ent in doc_nlp.ents:
                        canonical = ent.text.strip()
                        key = canonical.lower()
                        if key not in all_entities:
                            all_entities[key] = {
                                "id": str(uuid.uuid4()),
                                "job_id": self.job_id,
                                "canonical_name": canonical,
                                "entity_type": ent.label_,
                                "aliases": [],
                                "source_docs": []
                            }
                        if doc["filename"] not in all_entities[key]["source_docs"]:
                            all_entities[key]["source_docs"].append(doc["filename"])
                except Exception as e:
                    self.error(f"spaCy NER failed: {e}")

            # LLM fact extraction
            try:
                sample = full_text[:3000]
                raw = self.stream_llm(
                    FACT_EXTRACTION_PROMPT.format(text=sample),
                    system="Return only valid JSON array."
                )
                facts = _extract_json_array(raw)
                if facts:
                    extracted = 0
                    for fact in facts:
                        if isinstance(fact, dict) and fact.get("subject") and fact.get("value"):
                            all_facts.append({
                                "id": str(uuid.uuid4()),
                                "job_id": self.job_id,
                                "subject": str(fact.get("subject", "")),
                                "attribute": str(fact.get("attribute", "")),
                                "value": str(fact.get("value", "")),
                                "date_ref": str(fact.get("date_ref", "")),
                                "source_doc": doc["filename"],
                                "confidence": float(fact.get("confidence", 0.8))
                            })
                            extracted += 1
                    self.result(f"Extracted {extracted} facts from '{doc['filename']}'")
            except Exception as e:
                self.error(f"Fact extraction failed for '{doc['filename']}': {e}")

        entities_list = list(all_entities.values())
        self._fuzzy_merge_entities(entities_list)

        for entity in entities_list:
            save_entity(entity)
        for fact in all_facts:
            save_fact(fact)

        self.complete(
            f"Extracted {len(entities_list)} entities, {len(all_facts)} facts",
            {"entity_count": len(entities_list), "fact_count": len(all_facts)}
        )
        return {**context, "entities": entities_list, "facts": all_facts}

    def _fuzzy_merge_entities(self, entities: list):
        for i, e1 in enumerate(entities):
            for j, e2 in enumerate(entities):
                if i >= j or e1.get("_merged") or e2.get("_merged"):
                    continue
                if e1["entity_type"] != e2["entity_type"]:
                    continue
                score = fuzz.ratio(e1["canonical_name"].lower(), e2["canonical_name"].lower())
                if score > 85:
                    if e2["canonical_name"] not in e1["aliases"]:
                        e1["aliases"].append(e2["canonical_name"])
                    e1["source_docs"] = list(set(e1["source_docs"] + e2["source_docs"]))
                    e2["_merged"] = True
        entities[:] = [e for e in entities if not e.get("_merged")]
