"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { fetchDoc } from "@/lib/api"
import type { Suggestion } from "@/types/chat"

type Props = {
  suggestions: Suggestion[]
  onComplete: (accepted: Suggestion[]) => void
  onCancel: () => void
}

export default function ReviewPanel({ suggestions, onComplete, onCancel }: Props) {
  const [current, setCurrent] = useState(0)
  const [accepted, setAccepted] = useState<Suggestion[]>([])
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const requestedRef = useRef(new Set<string>())
  const oldRef = useRef<HTMLDivElement>(null)
  const newRef = useRef<HTMLDivElement>(null)

  const suggestion = suggestions[current]
  const isLast = current === suggestions.length - 1

  useEffect(() => {
    const filenames = [...new Set(suggestions.map((s) => s.filename))]
    filenames.forEach((fn) => {
      if (requestedRef.current.has(fn)) return
      requestedRef.current.add(fn)
      fetchDoc(fn).then((d) => setFileContents((prev) => ({ ...prev, [fn]: d.content })))
    })
  }, [suggestions])

  const scrollToChange = useCallback(() => {
    const row = oldRef.current?.querySelector("[data-change-start]") as HTMLElement | null
    if (row && oldRef.current) {
      const containerH = oldRef.current.clientHeight
      const rowTop = row.offsetTop
      oldRef.current.scrollTop = rowTop - containerH / 3
      if (newRef.current) newRef.current.scrollTop = oldRef.current.scrollTop
    }
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(scrollToChange)
    return () => cancelAnimationFrame(frame)
  }, [current, fileContents, scrollToChange])

  function syncScroll(source: "old" | "new") {
    const from = source === "old" ? oldRef.current : newRef.current
    const to = source === "old" ? newRef.current : oldRef.current
    if (from && to) to.scrollTop = from.scrollTop
  }

  function handleAccept() {
    const next = [...accepted, suggestion]
    if (isLast) {
      onComplete(next)
    } else {
      setAccepted(next)
      setCurrent(current + 1)
    }
  }

  function handleReject() {
    if (isLast) {
      onComplete(accepted)
    } else {
      setCurrent(current + 1)
    }
  }

  const content = fileContents[suggestion.filename]
  if (!content) {
    return <div className="flex items-center justify-center h-full text-zinc-600">Loading file...</div>
  }

  const newContent = content.replace(suggestion.old_text, suggestion.new_text)
  const oldLines = content.split("\n")
  const modifiedLines = newContent.split("\n")
  const changeStart = content.indexOf(suggestion.old_text)
  const changeLineStart = content.slice(0, changeStart).split("\n").length
  const changeLineEndOld = changeLineStart + suggestion.old_text.split("\n").length - 1
  const changeLineEndNew = changeLineStart + suggestion.new_text.split("\n").length - 1

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-zinc-400">{suggestion.filename}</span>
          <span className="text-xs text-zinc-500">line {suggestion.start_line}</span>
          <span className="text-xs text-zinc-600">{current + 1} / {suggestions.length}</span>
        </div>
        <button onClick={onCancel} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          Cancel
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={oldRef}
          onScroll={() => syncScroll("old")}
          className="flex-1 overflow-auto border-r border-zinc-800"
        >
          <div className="px-4 py-1.5 text-xs font-medium text-red-400 border-b border-zinc-800/50 sticky top-0 bg-zinc-950 z-10">
            Original
          </div>
          <table className="w-full border-collapse font-mono text-sm">
            <tbody>
              {oldLines.map((line, i) => {
                const lineNum = i + 1
                const isChanged = lineNum >= changeLineStart && lineNum <= changeLineEndOld
                return (
                  <tr
                    key={i}
                    className={isChanged ? "bg-red-950/30" : ""}
                    {...(lineNum === changeLineStart ? { "data-change-start": true } : {})}
                  >
                    <td className="w-12 text-right pr-3 select-none text-zinc-700 border-r border-zinc-800/30 py-0.5 align-top">
                      {lineNum}
                    </td>
                    <td className="w-6 text-center select-none py-0.5 align-top">
                      {isChanged && <span className="text-red-500 font-bold">-</span>}
                    </td>
                    <td className="px-3 py-0.5 whitespace-pre-wrap break-words">
                      {isChanged ? (
                        <span className="text-red-300">{line}</span>
                      ) : (
                        <span className="text-zinc-500">{line}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div
          ref={newRef}
          onScroll={() => syncScroll("new")}
          className="flex-1 overflow-auto"
        >
          <div className="px-4 py-1.5 text-xs font-medium text-green-400 border-b border-zinc-800/50 sticky top-0 bg-zinc-950 z-10">
            Modified
          </div>
          <table className="w-full border-collapse font-mono text-sm">
            <tbody>
              {modifiedLines.map((line, i) => {
                const lineNum = i + 1
                const isChanged = lineNum >= changeLineStart && lineNum <= changeLineEndNew
                return (
                  <tr key={i} className={isChanged ? "bg-green-950/30" : ""}>
                    <td className="w-12 text-right pr-3 select-none text-zinc-700 border-r border-zinc-800/30 py-0.5 align-top">
                      {lineNum}
                    </td>
                    <td className="w-6 text-center select-none py-0.5 align-top">
                      {isChanged && <span className="text-green-500 font-bold">+</span>}
                    </td>
                    <td className="px-3 py-0.5 whitespace-pre-wrap break-words">
                      {isChanged ? (
                        <span className="text-green-300">{line}</span>
                      ) : (
                        <span className="text-zinc-500">{line}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-zinc-800">
        <button
          onClick={handleReject}
          className="px-6 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-500 transition-colors"
        >
          No
        </button>
        <button
          onClick={handleAccept}
          className="px-6 py-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-500 transition-colors"
        >
          Yes
        </button>
      </div>
    </div>
  )
}
