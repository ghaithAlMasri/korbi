from app.core.config import settings
from app.core.security import safe_path
from app.core.exceptions import DocNotFoundError
from app.embeddings.service import EmbeddingService


def list_docs() -> list[dict]:
    files = sorted(settings.docs_dir.glob("*.md"))
    return [{"name": f.stem, "filename": f.name} for f in files]


def get_doc(filename: str) -> dict:
    filepath = safe_path(settings.docs_dir, filename)
    if not filepath.exists():
        raise DocNotFoundError(filename)
    return {"filename": filename, "name": filepath.stem, "content": filepath.read_text("utf-8")}


async def save_changes(changes: list[dict], embedding_svc: EmbeddingService) -> dict:
    changed_files = set()
    for change in changes:
        filepath = safe_path(settings.docs_dir, change["filename"])
        if not filepath.exists():
            continue
        content = filepath.read_text("utf-8")
        content = content.replace(change["old_text"], change["new_text"], 1)
        filepath.write_text(content, "utf-8")
        changed_files.add(change["filename"])

    for filename in changed_files:
        filepath = safe_path(settings.docs_dir, filename)
        content = filepath.read_text("utf-8")
        await embedding_svc.reindex_file(filename, content)

    return {"status": "ok", "saved": len(changes), "reindexed": list(changed_files)}
