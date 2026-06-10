import chromadb
import numpy as np
from sklearn.feature_extraction.text import HashingVectorizer
from config import CHROMA_DB_PATH

_client = None
_embedder = None


class _HashEmbedder:
    """Pure-Python embeddings via HashingVectorizer — no torch, no VC++ DLLs.

    Implements the ChromaDB 0.6.x EmbeddingFunction protocol (name is a
    @classmethod in 0.6.x, not a plain string attribute).
    """

    def __init__(self, n_features: int = 512):
        self._vec = HashingVectorizer(
            n_features=n_features,
            norm="l2",
            alternate_sign=False,
            analyzer="word",
            ngram_range=(1, 2),
        )

    # ChromaDB 0.6.x requires name() as a classmethod, not a string attribute
    @classmethod
    def name(cls) -> str:
        return "sklearn-hash-embedder"

    def encode(self, texts: list) -> np.ndarray:
        return self._vec.transform(texts).toarray().astype(np.float32)

    def __call__(self, input) -> list:
        return self.encode(input).tolist()

    # ChromaDB 0.6.x serialisation interface
    @classmethod
    def build_from_config(cls, config: dict) -> "_HashEmbedder":
        return cls()

    def get_config(self) -> dict:
        return {}

    def validate_config_update(self, old_config: dict, new_config: dict) -> None:
        pass


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return _client


def get_embedder() -> _HashEmbedder:
    global _embedder
    if _embedder is None:
        _embedder = _HashEmbedder()
    return _embedder


def get_or_create_collection(job_id: str):
    client = get_client()
    name = f"job_{job_id.replace('-', '_')}"
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
        embedding_function=get_embedder(),
    )


def add_chunks(job_id: str, chunks: list):
    """chunks: list of {id, content, metadata}"""
    if not chunks:
        return
    collection = get_or_create_collection(job_id)
    embedder = get_embedder()

    ids = [c["id"] for c in chunks]
    texts = [c["content"] for c in chunks]
    metadatas = [c.get("metadata", {}) for c in chunks]
    embeddings = embedder.encode(texts).tolist()

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )


def semantic_search(job_id: str, query: str, n_results: int = 5) -> list:
    collection = get_or_create_collection(job_id)
    embedder = get_embedder()
    query_embedding = embedder.encode([query]).tolist()

    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(n_results, count),
    )

    output = []
    if results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            output.append({
                "content": doc,
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if results.get("distances") else 0,
                "id": results["ids"][0][i],
            })
    return output


def delete_collection(job_id: str):
    client = get_client()
    name = f"job_{job_id.replace('-', '_')}"
    try:
        client.delete_collection(name)
    except Exception:
        pass
