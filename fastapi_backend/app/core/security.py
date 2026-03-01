from pathlib import Path
from fastapi import HTTPException


def safe_path(docs_dir: Path, filename: str) -> Path:
    resolved = (docs_dir / filename).resolve()
    if not resolved.is_relative_to(docs_dir.resolve()) or resolved.suffix != ".md":
        raise HTTPException(status_code=400, detail="Invalid filename")
    return resolved
