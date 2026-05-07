import xxhash
from service.core.rag.app.naive import chunk
from service.core.embedding import generate_embedding
from service.core.rag.utils.qdrant_conn import QdrantConnection
from qdrant_client.models import PointStruct
from typing import List


def dummy(prog=None, msg=""):
    pass


def parse(file_path: str) -> list:
    return chunk(file_path, callback=dummy)


def batch_generate_embeddings(texts: List[str]) -> List[List[float]]:
    try:
        embeddings = generate_embedding(texts)
        return embeddings if embeddings is not None else []
    except Exception as e:
        print(f"批量生成向量失败: {e}")
        return []


def execute_insert_process(file_path: str, file_name: str):
    """
    解析文档，生成 embedding，插入 Qdrant。
    用于线下预置文档建索引（由 index_documents.py 调用）。
    """
    documents = parse(file_path)
    if not documents:
        print(f"No documents found in {file_path}")
        return

    texts = [item["content_with_weight"] for item in documents]
    embeddings = batch_generate_embeddings(texts)

    if not embeddings or len(embeddings) != len(documents):
        print("Embedding count mismatch, aborting")
        return

    qdrant = QdrantConnection()
    qdrant.ensure_collection()

    points = []
    doc_id = xxhash.xxh64(file_name.encode("utf-8")).hexdigest()
    for item, embedding in zip(documents, embeddings):
        if embedding is None:
            continue
        # xxhash 返回 uint64，转成 signed int64 fit Qdrant 的 uint64 point id
        point_id = xxhash.xxh64(
            (item["content_with_weight"] + file_name).encode("utf-8")
        ).intdigest() % (2 ** 63)
        points.append(
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "content_with_weight": item["content_with_weight"],
                    "doc_id": doc_id,
                    "docnm_kwd": file_name,
                },
            )
        )

    if points:
        qdrant.client.upsert(collection_name=qdrant.collection, points=points)
        print(f"Inserted {len(points)} chunks from '{file_name}' into Qdrant")
