from service.core.embedding import generate_embedding
from service.core.qdrant_store import QdrantConnection, COLLECTION_NAME

_qdrant = None


def get_qdrant():
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantConnection()
    return _qdrant


def retrieve_content(question: str, top_k: int = 5) -> list:
    embedding = generate_embedding(question)
    if not embedding:
        return []

    results = get_qdrant().search(query_vector=embedding, top_k=top_k)

    extracted = []
    for i, point in enumerate(results, start=1):
        p = point.payload
        extracted.append({
            "id": i,
            "document_id": p.get("doc_id", ""),
            "document_name": p.get("docnm_kwd", "").split("/")[-1],
            "content_with_weight": p.get("content_with_weight", ""),
        })

    return extracted


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
