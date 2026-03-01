from fastapi import APIRouter, Depends

from app.docs import service
from app.docs.schemas import SaveRequest
from app.core.deps import get_embedding_svc
from app.embeddings.service import EmbeddingService

router = APIRouter(prefix="/api")


@router.get("/docs")
async def list_docs():
    return service.list_docs()


@router.get("/docs/{filename}")
async def get_doc(filename: str):
    return service.get_doc(filename)


@router.post("/save")
async def save_changes(
    req: SaveRequest,
    embedding_svc: EmbeddingService = Depends(get_embedding_svc),
):
    return await service.save_changes(req.changes, embedding_svc)
