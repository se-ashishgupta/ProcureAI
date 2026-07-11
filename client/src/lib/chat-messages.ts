import { extractTextContent } from "@/lib/rfp-content";

type StreamMessage = {
  id?: string;
  type?: string;
  content?: unknown;
  getType?: () => string;
};

function messageRole(message: StreamMessage): "human" | "ai" | "other" {
  if (message.type === "human" || message.getType?.() === "human") return "human";
  if (message.type === "ai" || message.getType?.() === "ai") return "ai";
  return "other";
}

/**
 * LangGraph stream + values snapshots can surface the same AI reply twice
 * (different ids). Collapse identical AI text for display.
 */
export function dedupeStreamMessages<T extends StreamMessage>(messages: T[]): T[] {
  const seenIds = new Set<string>();
  const seenAiText = new Set<string>();
  const result: T[] = [];

  for (const message of messages) {
    const id = message.id?.trim();
    if (id && seenIds.has(id)) continue;

    const role = messageRole(message);
    const text = extractTextContent(message.content).trim();
    if (!text) continue;

    if (role === "ai") {
      const key = text;
      if (seenAiText.has(key)) continue;
      seenAiText.add(key);
    }

    if (id) seenIds.add(id);
    result.push(message);
  }

  return result;
}
