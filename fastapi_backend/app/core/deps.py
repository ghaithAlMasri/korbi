from openai import AsyncOpenAI
from app.embeddings.service import EmbeddingService

_client: AsyncOpenAI | None = None
_embedding_svc: EmbeddingService | None = None


def init(client: AsyncOpenAI, embedding_svc: EmbeddingService):
    global _client, _embedding_svc
    _client = client
    _embedding_svc = embedding_svc


def get_client() -> AsyncOpenAI:
    return _client


def get_embedding_svc() -> EmbeddingService:
    return _embedding_svc
