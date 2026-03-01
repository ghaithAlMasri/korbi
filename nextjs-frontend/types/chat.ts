export type ToolCall = {
  name: string
  args: Record<string, unknown>
}

export type ToolResult = {
  name: string
  output: string
}

export type ChatMessage = {
  role: "user" | "assistant"
  text: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  done?: boolean
  timestamp: number
}

export type Suggestion = {
  filename: string
  old_text: string
  new_text: string
  start_line: number
}
