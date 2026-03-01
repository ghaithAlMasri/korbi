import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

from app.chat.schemas import ChatRequest
from app.chat.service import run_agent
from app.core.deps import get_client, get_embedding_svc
from app.embeddings.service import EmbeddingService

router = APIRouter(prefix="/api")


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.post("/chat")
async def chat(
    req: ChatRequest,
    client: AsyncOpenAI = Depends(get_client),
    embedding_svc: EmbeddingService = Depends(get_embedding_svc),
):
    async def stream():
        async for event in run_agent(req.messages, client, embedding_svc):
            yield sse_event(event)

    return StreamingResponse(stream(), media_type="text/event-stream")
