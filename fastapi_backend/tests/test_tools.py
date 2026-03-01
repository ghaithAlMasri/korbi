import json
import pytest
from unittest.mock import AsyncMock

from app.chat.tools import execute_tool

pytestmark = pytest.mark.asyncio


async def test_list_files(embedding_svc, tmp_docs):
    result = json.loads(await execute_tool("list_files", {}, embedding_svc))
    assert "quickstart.md" in result
    assert "agents.md" in result


async def test_read_file(embedding_svc, tmp_docs):
    result = await execute_tool("read_file", {"filename": "quickstart.md"}, embedding_svc)
    assert "Quickstart" in result
    assert "pip install" in result


async def test_read_file_not_found(embedding_svc, tmp_docs):
    result = json.loads(await execute_tool("read_file", {"filename": "nope.md"}, embedding_svc))
    assert "error" in result


async def test_read_file_traversal(embedding_svc, tmp_docs):
    with pytest.raises(Exception):
        await execute_tool("read_file", {"filename": "../../etc/passwd"}, embedding_svc)


async def test_search_docs(embedding_svc, tmp_docs):
    embedding_svc.search = AsyncMock(return_value=[
        {"filename": "agents.md", "heading": "Overview", "text": "Agents are autonomous...", "score": 0.85}
    ])
    result = json.loads(await execute_tool("search_docs", {"query": "agents"}, embedding_svc))
    assert len(result) == 1
    assert result[0]["filename"] == "agents.md"


async def test_suggest_edits_valid(embedding_svc, tmp_docs):
    result = json.loads(await execute_tool("suggest_edits", {
        "filename": "quickstart.md",
        "suggestions": [{
            "old_text": "mylib==1.0",
            "new_text": "mylib==2.0",
        }]
    }, embedding_svc))
    assert result["applied"] == 1
    assert result["suggestions"][0]["old_text"] == "mylib==1.0"
    assert result["suggestions"][0]["start_line"] > 0


async def test_suggest_edits_no_match(embedding_svc, tmp_docs):
    result = json.loads(await execute_tool("suggest_edits", {
        "filename": "quickstart.md",
        "suggestions": [{
            "old_text": "this text does not exist",
            "new_text": "replacement",
        }]
    }, embedding_svc))
    assert result["applied"] == 0
    assert result["suggestions"] == []


async def test_unknown_tool(embedding_svc):
    result = json.loads(await execute_tool("fake_tool", {}, embedding_svc))
    assert "error" in result
