import json
import numpy as np
from pathlib import Path


class ChunkStore:
    def __init__(self, dims: int):
        self.dims = dims
        self.chunks: list[dict] = []
        self.vectors: np.ndarray | None = None

    def load(self, store_path: Path) -> bool:
        if not store_path.exists():
            return False
        data = json.loads(store_path.read_text("utf-8"))
        self.chunks = data["chunks"]
        self.vectors = np.array(data["vectors"], dtype=np.float32) if data["vectors"] else None
        return len(self.chunks) > 0

    def save(self, store_path: Path):
        data = {
            "chunks": self.chunks,
            "vectors": self.vectors.tolist() if self.vectors is not None else [],
        }
        store_path.write_text(json.dumps(data), "utf-8")

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> list[dict]:
        if not self.chunks or self.vectors is None:
            return []

        norms = np.linalg.norm(self.vectors, axis=1) * np.linalg.norm(query_vector)
        norms = np.where(norms == 0, 1, norms)
        scores = self.vectors @ query_vector / norms

        top_idx = np.argsort(scores)[::-1][:top_k]

        return [
            {
                "filename": self.chunks[i]["filename"],
                "heading": self.chunks[i]["heading"],
                "text": self.chunks[i]["text"][:300],
                "score": float(scores[i]),
            }
            for i in top_idx
        ]

    def replace_file(self, filename: str, new_chunks: list[dict], new_vectors: np.ndarray | None):
        keep_idx = [i for i, c in enumerate(self.chunks) if c["filename"] != filename]
        kept_chunks = [self.chunks[i] for i in keep_idx]
        kept_vectors = (
            self.vectors[keep_idx]
            if self.vectors is not None and keep_idx
            else np.empty((0, self.dims), dtype=np.float32)
        )

        if new_chunks and new_vectors is not None:
            self.chunks = kept_chunks + new_chunks
            self.vectors = np.vstack([kept_vectors, new_vectors]) if kept_vectors.size else new_vectors
        else:
            self.chunks = kept_chunks
            self.vectors = kept_vectors

    @property
    def count(self) -> int:
        return len(self.chunks)
