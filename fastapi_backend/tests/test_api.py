import pytest
from unittest.mock import AsyncMock

pytestmark = pytest.mark.asyncio


async def test_health(client):
    res = await client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "chunks" in data


async def test_list_docs(client):
    res = await client.get("/api/docs")
    assert res.status_code == 200
    docs = res.json()
    filenames = [d["filename"] for d in docs]
    assert "quickstart.md" in filenames
    assert "agents.md" in filenames


async def test_get_doc(client):
    res = await client.get("/api/docs/quickstart.md")
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "quickstart.md"
    assert "Quickstart" in data["content"]


async def test_get_doc_not_found(client):
    res = await client.get("/api/docs/nonexistent.md")
    assert res.status_code == 404


async def test_path_traversal_blocked(client):
    res = await client.get("/api/docs/..%2F..%2Fetc%2Fpasswd")
    assert res.status_code in (400, 404, 422)


async def test_path_traversal_non_md(client):
    res = await client.get("/api/docs/secret.txt")
    assert res.status_code in (400, 422)


async def test_save_changes(client, tmp_docs, embedding_svc):
    embedding_svc.reindex_file = AsyncMock()
    res = await client.post("/api/save", json={
        "changes": [{
            "filename": "quickstart.md",
            "old_text": "mylib==1.0",
            "new_text": "mylib==2.0",
        }]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["saved"] == 1
    assert "quickstart.md" in data["reindexed"]

    content = (tmp_docs / "quickstart.md").read_text()
    assert "mylib==2.0" in content
    assert "mylib==1.0" not in content


async def test_save_ignores_nonexistent_file(client):
    res = await client.post("/api/save", json={
        "changes": [{
            "filename": "nope.md",
            "old_text": "x",
            "new_text": "y",
        }]
    })
    assert res.status_code in (200, 400)
