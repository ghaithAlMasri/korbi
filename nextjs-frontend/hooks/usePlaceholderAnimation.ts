"use client"

import { useState, useEffect, useCallback } from "react"

const PLACEHOLDERS = [
  "What would you like to change...",
  "e.g. Remove as_tool, use handoffs instead...",
  "e.g. Update the streaming API examples...",
  "e.g. Deprecate the old tracing format...",
  "Describe your documentation update...",
]

export function usePlaceholderAnimation(paused: boolean) {
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [active, setActive] = useState(true)
  const [phase, setPhase] = useState<"typing" | "waiting" | "erasing">("typing")

  useEffect(() => {
    if (!active || paused) return
    const target = PLACEHOLDERS[index]

    if (phase === "typing") {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 40)
        return () => clearTimeout(t)
      }
      setPhase("waiting")
      const t = setTimeout(() => setPhase("erasing"), 2000)
      return () => clearTimeout(t)
    }

    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 25)
        return () => clearTimeout(t)
      }
      setIndex((i) => (i + 1) % PLACEHOLDERS.length)
      setPhase("typing")
    }
  }, [displayed, phase, index, paused, active])

  const stop = useCallback(() => {
    setActive(false)
    setDisplayed("")
  }, [])

  return { placeholder: active ? displayed : "Ask anything...", stop, active }
}
