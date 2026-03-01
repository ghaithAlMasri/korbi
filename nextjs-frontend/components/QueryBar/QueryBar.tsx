"use client"

import { useState } from "react"
import type { ChatMessage } from "@/types/chat"
import { usePlaceholderAnimation } from "@/hooks/usePlaceholderAnimation"
import { useAutoScroll } from "@/hooks/useAutoScroll"
import AssistantMessage from "./AssistantMessage"

type Props = {
  onSubmit: (q: string) => void
  loading?: boolean
  messages: ChatMessage[]
}

export default function QueryBar({ onSubmit, loading, messages }: Props) {
  const [query, setQuery] = useState("")
  const { placeholder, stop: stopAnimation, active: animating } = usePlaceholderAnimation(!!loading)
  const scrollRef = useAutoScroll(messages)
  const hasMessages = messages.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return
    stopAnimation()
    onSubmit(query.trim())
    setQuery("")
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    if (animating) stopAnimation()
  }

  function handleFocus() {
    if (animating) stopAnimation()
  }

  return (
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-500 ease-out ${
      hasMessages ? "w-[700px]" : "w-[600px]"
    }`}>
      <div className="relative group">
        <div className={`absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-violet-500/50 blur-sm transition-all duration-500 ${
          hasMessages ? "opacity-100" : "opacity-50 group-hover:opacity-100"
        }`} />
        <div className="relative rounded-xl bg-zinc-900 border border-zinc-700/50 overflow-hidden flex flex-col">
          {hasMessages && (
            <div ref={scrollRef} className="overflow-y-auto max-h-80 px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                  {msg.role === "user" ? (
                    <div className="bg-violet-600/20 border border-violet-500/20 rounded-lg px-3 py-2 max-w-[80%]">
                      <span className="text-sm text-violet-200">{msg.text}</span>
                    </div>
                  ) : (
                    <AssistantMessage msg={msg} />
                  )}
                </div>
              ))}
            </div>
          )}

          {hasMessages && <div className="border-t border-zinc-800/50" />}

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                disabled={loading}
                className="w-full bg-transparent px-5 py-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {!loading && (
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-0 transition-all"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
