import json
import asyncio
from openai import AsyncOpenAI

from app.core.config import settings
from app.chat.tools import TOOLS, execute_tool
from app.embeddings.service import EmbeddingService

SYSTEM_PROMPT = """\
You are a documentation assistant. You help users understand and update markdown documentation files.

You have tools to search docs, read files, list files, and suggest edits. Use them as needed.

When the user asks a question, search and read relevant files to give an informed answer.
When the user asks for changes, read the file first, then use suggest_edits with exact old_text copied verbatim from the file.
Keep responses concise and direct."""


async def run_agent(messages: list[dict], client: AsyncOpenAI, embedding_svc: EmbeddingService):
    api_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    while True:
        stream = await client.chat.completions.create(
            model=settings.chat_model,
            messages=api_messages,
            tools=TOOLS,
            stream=True,
        )

        text_buf = ""
        tool_calls_buf: dict[int, dict] = {}

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if not delta:
                continue

            if delta.content:
                text_buf += delta.content
                yield {"type": "text", "content": delta.content}

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_buf:
                        tool_calls_buf[idx] = {"id": tc.id or "", "name": "", "arguments": ""}
                    if tc.id:
                        tool_calls_buf[idx]["id"] = tc.id
                    if tc.function and tc.function.name:
                        tool_calls_buf[idx]["name"] = tc.function.name
                    if tc.function and tc.function.arguments:
                        tool_calls_buf[idx]["arguments"] += tc.function.arguments

        if not tool_calls_buf:
            yield {"type": "done"}
            return

        assistant_msg = {"role": "assistant", "content": text_buf or None, "tool_calls": []}
        for idx in sorted(tool_calls_buf):
            tc = tool_calls_buf[idx]
            assistant_msg["tool_calls"].append({
                "id": tc["id"],
                "type": "function",
                "function": {"name": tc["name"], "arguments": tc["arguments"]},
            })
        api_messages.append(assistant_msg)

        async def _call(tc_data):
            name = tc_data["name"]
            args = json.loads(tc_data["arguments"])
            result = await execute_tool(name, args, embedding_svc)
            return tc_data["id"], name, args, result

        tasks = [_call(tool_calls_buf[idx]) for idx in sorted(tool_calls_buf)]
        results = await asyncio.gather(*tasks)

        all_suggestions = []

        for call_id, name, args, result in results:
            yield {"type": "tool_call", "name": name, "args": args}
            yield {"type": "tool_result", "name": name, "output": result}

            if name == "suggest_edits":
                parsed = json.loads(result)
                all_suggestions.extend(parsed.get("suggestions", []))

            api_messages.append({
                "role": "tool",
                "tool_call_id": call_id,
                "content": result,
            })

        if all_suggestions:
            yield {"type": "suggestions", "suggestions": all_suggestions}
            yield {"type": "done"}
            return
