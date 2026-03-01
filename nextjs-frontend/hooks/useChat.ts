"use client"

import { useState, useRef, useEffect } from "react"
import type { ChatMessage, Suggestion } from "@/types/chat"
import { chatStream } from "@/lib/api"
import { parseSSE } from "@/lib/stream"

function buildApiMessages(msgs: ChatMessage[]): { role: string; content: string }[] {
  return msgs
    .filter((m) => m.role === "user" || (m.role === "assistant" && m.text && m.done))
    .map((m) => ({ role: m.role, content: m.text }))
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  function updateLastAssistant(updater: (msg: ChatMessage) => ChatMessage) {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === "assistant") return [...prev.slice(0, -1), updater(last)]
      return prev
    })
  }

  async function send(text: string) {
    setLoading(true)
    setSuggestions(null)

    const userMsg: ChatMessage = { role: "user", text, timestamp: Date.now() }
    const assistantMsg: ChatMessage = {
      role: "assistant",
      text: "",
      toolCalls: [],
      toolResults: [],
      done: false,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])

    const apiMessages = [...buildApiMessages(messages), { role: "user", content: text }]
    abortRef.current = new AbortController()

    try {
      const res = await chatStream(apiMessages, abortRef.current.signal)

      for await (const data of parseSSE(res)) {
        if (data.type === "text") {
          updateLastAssistant((msg) => ({ ...msg, text: msg.text + data.content }))
        } else if (data.type === "tool_call") {
          updateLastAssistant((msg) => ({
            ...msg,
            toolCalls: [...(msg.toolCalls || []), { name: data.name, args: data.args }],
          }))
        } else if (data.type === "tool_result") {
          updateLastAssistant((msg) => ({
            ...msg,
            toolResults: [...(msg.toolResults || []), { name: data.name, output: data.output }],
          }))
        } else if (data.type === "suggestions") {
          setSuggestions((prev) => [...(prev || []), ...data.suggestions as Suggestion[]])
        } else if (data.type === "done") {
          updateLastAssistant((msg) => ({ ...msg, done: true }))
          setLoading(false)
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      updateLastAssistant((msg) => ({ ...msg, text: "Something went wrong.", done: true }))
    } finally {
      setLoading(false)
    }
  }

  function clearSuggestions() {
    setSuggestions(null)
  }

  function addSummary(text: string) {
    setMessages((prev) => [...prev, {
      role: "assistant" as const,
      text,
      done: true,
      timestamp: Date.now(),
    }])
  }

  return { messages, loading, suggestions, send, clearSuggestions, addSummary }
}
