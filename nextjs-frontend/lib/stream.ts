export type SSEEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; output: string }
  | { type: "suggestions"; suggestions: unknown[] }
  | { type: "done" }

export async function* parseSSE(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const dataLine = line.trim()
        if (!dataLine.startsWith("data: ")) continue
        yield JSON.parse(dataLine.slice(6)) as SSEEvent
      }
    }
  } finally {
    reader.releaseLock()
  }
}
