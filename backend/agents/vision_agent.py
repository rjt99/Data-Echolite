from agents.base_agent import BaseAgent
from services.llm_service import vision_llm_call
from tools.image_tools import load_and_encode_image

CHART_PROMPT = (
    "Analyze this image from a document. "
    "If it's a chart/graph: extract title, axis labels, all data points/values, legend, and key insight. "
    "If it's a diagram/flow: describe all entities, relationships, and what process it represents. "
    "If it's a table: extract all rows and columns as structured text. "
    "If it's a photo/screenshot: describe the information it conveys. "
    "Return a structured description capturing ALL numerical data visible."
)


class VisionAgent(BaseAgent):
    name = "VisionAgent"

    def run(self, context: dict) -> dict:
        parsed_docs = context.get("parsed_docs", [])

        for doc in parsed_docs:
            image_blocks = [b for b in doc.get("blocks", []) if b["type"] in ("image", "image_file")]
            if not image_blocks:
                continue

            self.thinking(f"Analyzing {len(image_blocks)} image(s) from '{doc['filename']}'...")

            for block in image_blocks:
                try:
                    if block["type"] == "image_file":
                        b64, mime = load_and_encode_image(block["file_path"])
                    else:
                        b64, mime = block["b64"], block.get("mime", "image/jpeg")

                    page_ref = block.get("page", "?")
                    self.action(f"Vision analysis on image — page {page_ref}")
                    description = vision_llm_call(CHART_PROMPT, b64, mime)

                    block["vision_description"] = description
                    block["type"] = "image_analyzed"

                    doc["blocks"].append({
                        "type": "text",
                        "content": f"[Image Analysis — {doc['filename']} page {page_ref}]\n{description}",
                        "source": doc["filename"],
                        "page": page_ref,
                        "derived_from": "vision"
                    })

                    self.result(
                        f"Image page {page_ref} analyzed",
                        {"preview": description[:200]}
                    )
                except Exception as e:
                    self.error(f"Vision analysis failed: {e}")

        self.complete("Vision analysis complete")
        return context
