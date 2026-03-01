from contextlib import asynccontextmanager
from openai import AsyncOpenAI, APIError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core import deps
from app.core.exceptions import DocNotFoundError, openai_error_handler, doc_not_found_handler
from app.embeddings.service import EmbeddingService
from app.chat.router import router as chat_router
from app.docs.router import router as docs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    embedding_svc = EmbeddingService(client)
    deps.init(client, embedding_svc)
    await embedding_svc.startup()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(APIError, openai_error_handler)
app.add_exception_handler(DocNotFoundError, doc_not_found_handler)

app.include_router(chat_router)
app.include_router(docs_router)


@app.get("/health")
async def health():
    embedding_svc = deps.get_embedding_svc()
    return {"status": "ok", "chunks": embedding_svc.store.count}
