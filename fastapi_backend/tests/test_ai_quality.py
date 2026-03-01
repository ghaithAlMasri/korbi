import pytest
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.core.config import settings
from app.chat.service import run_agent
from app.embeddings.service import EmbeddingService

pytestmark = [
    pytest.mark.asyncio,
    pytest.mark.ai,
]


@pytest.fixture
async def live_svc(tmp_docs):
    settings.docs_dir = tmp_docs
    client = AsyncOpenAI()
    svc = EmbeddingService(client)
    await svc.build_index()
    return client, svc


async def collect_events(messages, client, svc):
    events = []
    async for event in run_agent(messages, client, svc):
        events.append(event)
    return events


async def test_question_returns_text(live_svc, tmp_docs):
    client, svc = live_svc
    events = await collect_events(
        [{"role": "user", "content": "What is the quickstart about?"}],
        client, svc,
    )

    types = [e["type"] for e in events]
    assert "text" in types
    assert "done" in types

    text = "".join(e["content"] for e in events if e["type"] == "text")
    assert len(text) > 10


async def test_edit_request_produces_suggestions(live_svc, tmp_docs):
    client, svc = live_svc
    events = await collect_events(
        [{"role": "user", "content": "Update the quickstart to change mylib==1.0 to mylib==2.0"}],
        client, svc,
    )

    types = [e["type"] for e in events]
    assert "suggestions" in types

    suggestions_event = next(e for e in events if e["type"] == "suggestions")
    suggestions = suggestions_event["suggestions"]
    assert len(suggestions) >= 1
    assert any("mylib==2.0" in s["new_text"] for s in suggestions)


async def test_agent_uses_tools(live_svc, tmp_docs):
    client, svc = live_svc
    events = await collect_events(
        [{"role": "user", "content": "What configuration options do agents have?"}],
        client, svc,
    )

    tool_calls = [e for e in events if e["type"] == "tool_call"]
    assert len(tool_calls) > 0

    tool_names = [tc["name"] for tc in tool_calls]
    assert "search_docs" in tool_names or "read_file" in tool_names


async def test_edit_old_text_is_verbatim(live_svc, tmp_docs):
    client, svc = live_svc
    events = await collect_events(
        [{"role": "user", "content": "Change max_turns=10 to max_turns=20 in agents.md"}],
        client, svc,
    )

    suggestions_events = [e for e in events if e["type"] == "suggestions"]
    if not suggestions_events:
        pytest.skip("Agent did not produce suggestions")

    content = (tmp_docs / "agents.md").read_text()
    for s in suggestions_events[0]["suggestions"]:
        assert s["old_text"] in content, f"old_text not found verbatim: {s['old_text'][:50]}"
