const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type DocFile = { name: string; filename: string }
export type DocContent = { filename: string; name: string; content: string }

export async function fetchDocs(): Promise<DocFile[]> {
  const res = await fetch(`${API}/api/docs`)
  if (!res.ok) throw new Error(`Failed to fetch docs: ${res.status}`)
  return res.json()
}

export async function fetchDoc(filename: string): Promise<DocContent> {
  const res = await fetch(`${API}/api/docs/${filename}`)
  if (!res.ok) throw new Error(`Failed to fetch doc: ${res.status}`)
  return res.json()
}

export async function saveChanges(changes: unknown[]): Promise<{ status: string; saved: number; reindexed: string[] }> {
  const res = await fetch(`${API}/api/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes }),
  })
  if (!res.ok) throw new Error(`Failed to save: ${res.status}`)
  return res.json()
}

export function chatStream(messages: { role: string; content: string }[], signal?: AbortSignal): Promise<Response> {
  return fetch(`${API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  })
}
