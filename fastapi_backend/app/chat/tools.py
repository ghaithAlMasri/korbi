import json

from app.core.config import settings
from app.core.security import safe_path
from app.embeddings.service import EmbeddingService

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_docs",
            "description": "Semantic search across all documentation chunks. Returns ranked results with filenames, headings, snippets, and similarity scores.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "top_k": {"type": "integer", "description": "Number of results to return", "default": 10},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the full contents of a documentation file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {"type": "string", "description": "The markdown filename (e.g. 'quickstart.md')"},
                },
                "required": ["filename"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List all documentation files available in the docs directory.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_edits",
            "description": "Propose exact text replacements to a documentation file. Each suggestion must have old_text (verbatim from the file) and new_text (the replacement).",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {"type": "string", "description": "The file to edit"},
                    "suggestions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "old_text": {"type": "string", "description": "Exact text to find in the file"},
                                "new_text": {"type": "string", "description": "Replacement text"},
                            },
                            "required": ["old_text", "new_text"],
                        },
                    },
                },
                "required": ["filename", "suggestions"],
            },
        },
    },
]


async def execute_tool(name: str, args: dict, embedding_svc: EmbeddingService) -> str:
    docs_dir = settings.docs_dir

    if name == "search_docs":
        results = await embedding_svc.search(args["query"], top_k=args.get("top_k", 10))
        return json.dumps(results)

    if name == "read_file":
        filepath = safe_path(docs_dir, args["filename"])
        if not filepath.exists():
            return json.dumps({"error": f"File not found: {args['filename']}"})
        return filepath.read_text("utf-8")

    if name == "list_files":
        files = sorted(docs_dir.glob("*.md"))
        return json.dumps([f.name for f in files])

    if name == "suggest_edits":
        filename = args["filename"]
        filepath = safe_path(docs_dir, filename)
        if not filepath.exists():
            return json.dumps({"error": f"File not found: {filename}"})
        content = filepath.read_text("utf-8")
        valid = []
        for s in args.get("suggestions", []):
            old_text = s.get("old_text", "")
            new_text = s.get("new_text", "")
            if old_text and new_text and old_text in content:
                idx = content.index(old_text)
                start_line = content[:idx].count("\n") + 1
                valid.append({
                    "filename": filename,
                    "old_text": old_text,
                    "new_text": new_text,
                    "start_line": start_line,
                })
        return json.dumps({"applied": len(valid), "suggestions": valid})

    return json.dumps({"error": f"Unknown tool: {name}"})
