from typing import Generator

from service.core.embedding import generate_embedding
from service.core.qdrant_store import QdrantConnection, COLLECTION_NAME

_qdrant = None


def get_qdrant():
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantConnection()
    return _qdrant


def _clip(text: str, limit: int = 260) -> str:
    text = " ".join((text or "").split())
    return text if len(text) <= limit else f"{text[:limit]}..."


def _trace(
    step_id: str,
    title: str,
    status: str,
    description: str,
    details: dict | None = None,
    matches: list | None = None,
) -> dict:
    payload = {
        "id": step_id,
        "title": title,
        "status": status,
        "description": description,
    }
    if details:
        payload["details"] = details
    if matches is not None:
        payload["matches"] = matches
    return payload


def retrieve_content_with_trace(
    question: str,
    top_k: int = 5,
) -> Generator[dict, None, list]:
    yield _trace(
        "query",
        "Question to Query",
        "running",
        "Receiving the user question and preparing the retrieval query.",
        {"user_question": question},
    )
    yield _trace(
        "query",
        "Question to Query",
        "complete",
        "Using the original question as the semantic search query.",
        {
            "generated_queries": [question],
            "strategy": "direct semantic query",
            "top_k": top_k,
        },
    )

    yield _trace(
        "embedding",
        "Embedding",
        "running",
        "Converting the query into a 1024-dimensional DashScope embedding.",
        {"model": "text-embedding-v3", "dimensions": 1024},
    )
    embedding = generate_embedding(question)
    if not embedding:
        yield _trace(
            "embedding",
            "Embedding",
            "error",
            "Embedding generation failed, so retrieval cannot continue.",
        )
        return []
    yield _trace(
        "embedding",
        "Embedding",
        "complete",
        "Query vector is ready for similarity search.",
        {
            "model": "text-embedding-v3",
            "dimensions": len(embedding),
            "vector_preview": [round(value, 4) for value in embedding[:8]],
        },
    )

    yield _trace(
        "search",
        "Vector Search",
        "running",
        "Searching Qdrant for the nearest document chunks.",
        {"database": "Qdrant", "collection": COLLECTION_NAME, "top_k": top_k},
    )
    results = get_qdrant().search(query_vector=embedding, top_k=top_k)

    extracted = []
    matches = []
    for i, point in enumerate(results, start=1):
        p = point.payload
        item = {
            "id": i,
            "document_id": p.get("doc_id", ""),
            "document_name": p.get("docnm_kwd", "").split("/")[-1],
            "content_with_weight": p.get("content_with_weight", ""),
            "score": getattr(point, "score", None),
        }
        extracted.append(item)
        matches.append({
            "rank": i,
            "score": item["score"],
            "document_name": item["document_name"],
            "content_preview": _clip(item["content_with_weight"]),
        })

    yield _trace(
        "search",
        "Vector Search",
        "complete",
        f"Qdrant returned {len(extracted)} candidate chunks.",
        {"database": "Qdrant", "collection": COLLECTION_NAME},
        matches,
    )
    yield _trace(
        "rerank",
        "Ranking",
        "complete",
        "Candidates are already ordered by vector similarity; the top chunks become the context set.",
        {
            "method": "Qdrant cosine similarity order",
            "selected_top_k": len(extracted),
            "requested_top_k": top_k,
        },
        matches,
    )
    yield _trace(
        "context",
        "Prompt Context",
        "complete",
        "Packing the ranked chunks into the prompt that will be sent to the LLM.",
        {
            "chunk_count": len(extracted),
            "documents": sorted({
                item["document_name"]
                for item in extracted
                if item.get("document_name")
            }),
        },
    )

    return extracted


def retrieve_content(question: str, top_k: int = 5) -> list:
    references = []
    trace = retrieve_content_with_trace(question, top_k)
    while True:
        try:
            next(trace)
        except StopIteration as result:
            references = result.value or []
            break
    return references


def list_documents() -> list[str]:
    qdrant = get_qdrant()
    results, _ = qdrant.client.scroll(
        collection_name=COLLECTION_NAME,
        with_payload=["docnm_kwd"],
        limit=1000,
    )
    docs = sorted({
        p.payload.get("docnm_kwd", "").split("/")[-1]
        for p in results
        if p.payload.get("docnm_kwd")
    })
    return docs


if __name__ == "__main__":
    res = retrieve_content("世运电路成长性如何")
    for r in res:
        print(r["document_name"], ":", r["content_with_weight"][:100])
