"use client"

import { useState } from "react"
import type { ToolCall, ToolResult } from "@/types/chat"

type Props = {
  toolCalls: ToolCall[]
  toolResults: ToolResult[]
}

export default function ToolActivity({ toolCalls, toolResults }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (toolCalls.length === 0) return null

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-400 transition-colors"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>&#9656;</span>
        <span>Used {toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""}</span>
      </button>
      {expanded && (
        <div className="mt-1.5 ml-3 space-y-1.5 border-l border-zinc-800 pl-2.5">
          {toolCalls.map((tc, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-cyan-400">{tc.name}</span>
                <span className="text-zinc-600">
                  {tc.name === "search_docs" && tc.args.query ? `"${tc.args.query}"` : ""}
                  {tc.name === "read_file" && tc.args.filename ? String(tc.args.filename) : ""}
                  {tc.name === "suggest_edits" && tc.args.filename ? String(tc.args.filename) : ""}
                </span>
              </div>
              {toolResults[i] && (
                <div className="text-[10px] font-mono text-zinc-600 truncate max-w-[500px]">
                  {toolResults[i].output.slice(0, 120)}
                  {toolResults[i].output.length > 120 ? "..." : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
