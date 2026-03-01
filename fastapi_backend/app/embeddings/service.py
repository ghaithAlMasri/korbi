import re
import numpy as np
from pathlib import Path
from openai import AsyncOpenAI

from app.core.config import settings
from app.embeddings.store import ChunkStore


class EmbeddingService:
    def __init__(self, client: AsyncOpenAI):
        self.client = client
        self.store = ChunkStore(settings.embedding_dims)

    async def startup(self):
        store_path = settings.docs_dir / settings.store_file
        if not self.store.load(store_path):
            await self.build_index()

    async def build_index(self):
        chunks = self._chunk_all(settings.docs_dir)
        self.store.chunks = chunks
        texts = [c["text"] for c in chunks]
        self.store.vectors = await self._embed_texts(texts)
        self.store.save(settings.docs_dir / settings.store_file)

    async def search(self, query: str, top_k: int = 10) -> list[dict]:
        q_vec = await self._embed_texts([query])
        return self.store.search(q_vec[0], top_k)

    async def reindex_file(self, filename: str, content: str):
        new_chunks = self._chunk_markdown(filename, content)
        new_vectors = await self._embed_texts([c["text"] for c in new_chunks]) if new_chunks else None
        self.store.replace_file(filename, new_chunks, new_vectors)
        self.store.save(settings.docs_dir / settings.store_file)

    async def _embed_texts(self, texts: list[str]) -> np.ndarray:
        batches = [texts[i:i + 100] for i in range(0, len(texts), 100)]
        all_embeddings = []
        for batch in batches:
            resp = await self.client.embeddings.create(model=settings.embedding_model, input=batch)
            all_embeddings.extend([e.embedding for e in resp.data])
        return np.array(all_embeddings, dtype=np.float32)

    @staticmethod
    def _chunk_markdown(filename: str, content: str) -> list[dict]:
        sections = re.split(r"(?=^#{1,3}\s)", content, flags=re.MULTILINE)
        chunks = []

        for section in sections:
            section = section.strip()
            if not section or len(section) < 20:
                continue

            heading_match = re.match(r"^(#{1,3})\s+(.+)", section)
            heading = heading_match.group(2).strip() if heading_match else ""

            if len(section) > 2000:
                paras = section.split("\n\n")
                buf = ""
                for para in paras:
                    if len(buf) + len(para) > 1500 and buf:
                        chunks.append({"filename": filename, "heading": heading, "text": buf.strip()})
                        buf = para + "\n\n"
                    else:
                        buf += para + "\n\n"
                if buf.strip():
                    chunks.append({"filename": filename, "heading": heading, "text": buf.strip()})
            else:
                chunks.append({"filename": filename, "heading": heading, "text": section})

        return chunks

    @staticmethod
    def _chunk_all(docs_dir: Path) -> list[dict]:
        chunks = []
        for fp in sorted(docs_dir.glob("*.md")):
            content = fp.read_text("utf-8")
            chunks.extend(EmbeddingService._chunk_markdown(fp.name, content))
        return chunks
