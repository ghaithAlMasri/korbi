"use client"

import type { ChatMessage } from "@/types/chat"
import ToolActivity from "./ToolActivity"

export default function AssistantMessage({ msg }: { msg: ChatMessage }) {
  const hasTools = msg.toolCalls && msg.toolCalls.length > 0

  return (
    <div className="px-1">
      {hasTools && (
        <ToolActivity toolCalls={msg.toolCalls!} toolResults={msg.toolResults || []} />
      )}
      {msg.text && (
        <div className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.text}</div>
      )}
      {!msg.done && !msg.text && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-600">Thinking...</span>
        </div>
      )}
    </div>
  )
}
