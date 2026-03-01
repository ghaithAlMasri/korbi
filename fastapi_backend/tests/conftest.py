import pytest
from unittest.mock import AsyncMock

from httpx import AsyncClient, ASGITransport
from openai import AsyncOpenAI

from app.core.config import settings
from app.core import deps
from app.embeddings.service import EmbeddingService
from app.main import app


@pytest.fixture
def tmp_docs(tmp_path):
    doc1 = tmp_path / "quickstart.md"
    doc1.write_text("# Quickstart\n\nInstall with pip:\n\n```bash\npip install mylib==1.0\n```\n\nThen run `mylib init`.\n")

    doc2 = tmp_path / "agents.md"
    doc2.write_text("# Agents\n\n## Overview\n\nAgents are autonomous workers that use tools.\n\n## Configuration\n\nSet `max_turns=10` in the agent config.\n")

    return tmp_path


@pytest.fixture
def mock_client():
    return AsyncMock(spec=AsyncOpenAI)


@pytest.fixture
def embedding_svc(mock_client, tmp_docs):
    settings.docs_dir = tmp_docs
    svc = EmbeddingService(mock_client)
    return svc


@pytest.fixture
async def client(tmp_docs, mock_client, embedding_svc):
    settings.docs_dir = tmp_docs
    deps.init(mock_client, embedding_svc)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
