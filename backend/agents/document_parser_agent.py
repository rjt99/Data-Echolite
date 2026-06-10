from agents.base_agent import BaseAgent
from tools.pdf_tools import extract_text_from_pdf, extract_tables_from_pdf
from tools.text_tools import read_docx, read_pptx, read_csv_or_excel, read_json, chunk_text


class DocumentParserAgent(BaseAgent):
    name = "DocumentParserAgent"

    def run(self, context: dict) -> dict:
        documents = context.get("documents", [])
        parsed_docs = []

        for doc in documents:
            file_type = doc["file_type"]
            filename = doc["filename"]
            self.thinking(f"Parsing '{filename}' ({file_type})...")

            parsed = {
                "doc_id": doc["id"],
                "filename": filename,
                "file_type": file_type,
                "blocks": []
            }

            try:
                if file_type == "pdf":
                    parsed = self._parse_pdf(doc, parsed)
                elif file_type in ("docx", "doc"):
                    parsed = self._parse_docx(doc, parsed)
                elif file_type in ("pptx", "ppt"):
                    parsed = self._parse_pptx(doc, parsed)
                elif file_type in ("csv", "xlsx", "xls"):
                    parsed = self._parse_tabular(doc, parsed)
                elif file_type == "json":
                    parsed = self._parse_json(doc, parsed)
                elif file_type == "txt":
                    parsed = self._parse_text(doc, parsed)
                # image/video file types are skipped in text/PDF mode

                self.result(
                    f"Parsed '{filename}': {len(parsed['blocks'])} content blocks",
                    {"filename": filename, "block_count": len(parsed["blocks"])}
                )
            except Exception as e:
                self.error(f"Failed to parse '{filename}': {e}")

            parsed_docs.append(parsed)

        self.complete(f"Parsed {len(parsed_docs)} document(s)")
        return {**context, "parsed_docs": parsed_docs}

    def _parse_pdf(self, doc, parsed):
        pages = extract_text_from_pdf(doc["file_path"])
        tables = extract_tables_from_pdf(doc["file_path"])

        for page in pages:
            if page["text"]:
                for chunk in chunk_text(page["text"]):
                    parsed["blocks"].append({
                        "type": "text", "content": chunk,
                        "page": page["page"], "source": doc["filename"]
                    })

        for table in tables:
            parsed["blocks"].append({
                "type": "table", "content": table["text_repr"],
                "page": table["page"], "source": doc["filename"],
                "rows": table["rows"]
            })

        parsed["has_images"] = False
        parsed["has_tables"] = len(tables) > 0
        parsed["page_count"] = len(pages)
        return parsed

    def _parse_docx(self, doc, parsed):
        paragraphs = read_docx(doc["file_path"])
        full_text = "\n".join(p["text"] for p in paragraphs)
        for chunk in chunk_text(full_text):
            parsed["blocks"].append({"type": "text", "content": chunk, "source": doc["filename"]})
        return parsed

    def _parse_pptx(self, doc, parsed):
        slides = read_pptx(doc["file_path"])
        for slide in slides:
            parsed["blocks"].append({
                "type": "text", "content": slide["text"],
                "page": slide["slide"], "source": doc["filename"]
            })
        return parsed

    def _parse_tabular(self, doc, parsed):
        data = read_csv_or_excel(doc["file_path"])
        parsed["blocks"].append({
            "type": "table", "content": data["text_repr"],
            "source": doc["filename"],
            "metadata": {
                "columns": data["columns"],
                "row_count": data["row_count"],
                "sample": data["sample"]
            }
        })
        parsed["structured_data"] = data
        return parsed

    def _parse_json(self, doc, parsed):
        data = read_json(doc["file_path"])
        parsed["blocks"].append({
            "type": "text", "content": data["text_repr"], "source": doc["filename"]
        })
        return parsed

    def _parse_text(self, doc, parsed):
        with open(doc["file_path"], "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        for chunk in chunk_text(text):
            parsed["blocks"].append({"type": "text", "content": chunk, "source": doc["filename"]})
        return parsed
