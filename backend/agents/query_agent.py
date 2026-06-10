from agents.base_agent import BaseAgent
from services.vector_store import semantic_search
from services.llm_service import simple_llm_call

RAG_PROMPT = """Answer the question using ONLY the context below from the user's documents.
If the answer is not in the context, say "I don't have enough information to answer this."
Always cite the source document and page.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""


class QueryAgent(BaseAgent):
    name = "QueryAgent"

    def run(self, context: dict) -> dict:
        query = context.get("query", "")
        job_id = context.get("job_id", self.job_id)

        if not query:
            return {**context, "answer": "No query provided", "sources": []}

        self.thinking(f"Searching: '{query}'")
        results = semantic_search(job_id, query, n_results=5)

        if not results:
            self.result("No relevant content found")
            return {**context, "answer": "No relevant content found in documents", "sources": []}

        self.action(f"Found {len(results)} relevant chunks — synthesizing answer...")

        context_text = "\n\n".join([
            f"[Source: {r['metadata'].get('filename', 'unknown')}, page {r['metadata'].get('page', '?')}]\n{r['content']}"
            for r in results
        ])

        answer = simple_llm_call(
            RAG_PROMPT.format(context=context_text, question=query),
            system="You are a precise analyst. Answer based only on the provided context."
        )

        sources = [
            {
                "filename": r["metadata"].get("filename", "unknown"),
                "page": r["metadata"].get("page", "?"),
                "relevance": round(1 - float(r.get("distance", 0)), 3),
                "excerpt": r["content"][:200]
            }
            for r in results
        ]

        self.complete(
            f"Answer generated from {len(sources)} sources",
            {"answer": answer, "sources": sources}
        )
        return {**context, "answer": answer, "sources": sources}
