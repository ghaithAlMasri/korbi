from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    docs_dir: Path = Path(__file__).resolve().parent.parent.parent.parent / "docs_data"
    cors_origins: list[str] = ["http://localhost:3000"]
    chat_model: str = "gpt-5.2"
    embedding_model: str = "text-embedding-3-small"
    embedding_dims: int = 1536
    store_file: str = "embeddings.json"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
