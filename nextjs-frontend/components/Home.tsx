"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { DocFile } from "@/lib/api"
import type { Suggestion } from "@/types/chat"
import { fetchDocs, fetchDoc, saveChanges } from "@/lib/api"
import { useChat } from "@/hooks/useChat"
import Sidebar from "./Sidebar"
import QueryBar from "./QueryBar"
import ReviewPanel from "./ReviewPanel"

const Editor = dynamic(() => import("./Editor"), { ssr: false })

export default function Home() {
  const [files, setFiles] = useState<DocFile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const { messages, loading, suggestions, send, clearSuggestions, addSummary } = useChat()

  useEffect(() => {
    fetchDocs().then(setFiles).catch(() => {})
  }, [])

  async function handleSelectFile(filename: string) {
    setSelected(filename)
    const d = await fetchDoc(filename)
    setContent(d.content)
  }

  async function handleReviewComplete(accepted: Suggestion[]) {
    const rejected = suggestions!.filter((s) => !accepted.includes(s))

    if (accepted.length > 0) {
      await saveChanges(accepted)
      if (selected) {
        const d = await fetchDoc(selected)
        setContent(d.content)
      }
    }

    const updatedFiles = [...new Set(accepted.map((s) => s.filename))]
    const rejectedFiles = [...new Set(rejected.map((s) => s.filename))]

    let summary = ""
    if (accepted.length > 0 && rejected.length > 0) {
      summary = `Applied ${accepted.length} edit${accepted.length > 1 ? "s" : ""} to ${updatedFiles.join(", ")}. Skipped ${rejected.length} in ${rejectedFiles.join(", ")}.`
    } else if (accepted.length > 0) {
      summary = `Done — applied ${accepted.length} edit${accepted.length > 1 ? "s" : ""} to ${updatedFiles.join(", ")}.`
    } else {
      summary = `All ${rejected.length} suggested edit${rejected.length > 1 ? "s" : ""} rejected. No files changed.`
    }

    addSummary(summary)
    clearSuggestions()
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300">
      <Sidebar files={files} selected={selected} onSelect={handleSelectFile} />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {suggestions ? (
          <ReviewPanel
            suggestions={suggestions}
            onComplete={handleReviewComplete}
            onCancel={clearSuggestions}
          />
        ) : (
          <>
            {selected ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2 text-sm font-mono border-b border-zinc-800 text-zinc-400">
                  {selected}
                </div>
                <div className="flex-1 overflow-auto pb-24">
                  <Editor content={content} />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-600">
                Select a file to view
              </div>
            )}
            <QueryBar onSubmit={send} loading={loading} messages={messages} />
          </>
        )}
      </main>
    </div>
  )
}
