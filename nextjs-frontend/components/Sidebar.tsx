"use client"

import { useState } from "react"
import type { DocFile } from "@/lib/api"

type Props = {
  files: DocFile[]
  selected: string | null
  onSelect: (filename: string) => void
}

const PER_PAGE = 20

export default function Sidebar({ files, selected, onSelect }: Props) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(files.length / PER_PAGE)
  const pageFiles = files.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col">
      <div className="p-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
        Files ({files.length})
      </div>
      <div className="flex-1 overflow-y-auto">
        {pageFiles.map((f) => (
          <button
            key={f.filename}
            onClick={() => onSelect(f.filename)}
            className={`w-full text-left px-3 py-1.5 text-sm font-mono truncate hover:bg-zinc-800 ${
              selected === f.filename ? "bg-zinc-800 text-white" : ""
            }`}
          >
            {f.filename}
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-2 border-t border-zinc-800 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-30"
          >
            Prev
          </button>
          <span>{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </aside>
  )
}
