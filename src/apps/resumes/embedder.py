import uuid

from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from core.config import settings

COLLECTION_NAME = "resumes"
VECTOR_SIZE = 1536  # text-embedding-3-small output dimension


def _client() -> QdrantClient:
    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY or None,
    )


def _embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=settings.OPENAI_API_KEY,
    )


def _ensure_collection(client: QdrantClient) -> None:
    existing = {c.name for c in client.get_collections().collections}
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def embed_resume_chunks(
    resume_id: uuid.UUID, user_id: uuid.UUID, chunks: list[str]
) -> int:
    """Embed chunks and upsert into Qdrant. Returns number of points stored."""
    client = _client()
    _ensure_collection(client)

    vectors = _embeddings().embed_documents(chunks)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "resume_id": str(resume_id),
                "user_id": str(user_id),
                "chunk_index": i,
                "text": chunk,
            },
        )
        for i, (chunk, vector) in enumerate(zip(chunks, vectors))
    ]

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    return len(points)


def delete_resume_chunks(resume_id: uuid.UUID) -> None:
    """Remove all Qdrant points associated with a resume."""
    client = _client()
    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="resume_id",
                        match=MatchValue(value=str(resume_id)),
                    )
                ]
            ),
        )
    except Exception:
        pass  # collection may not exist yet on first run
