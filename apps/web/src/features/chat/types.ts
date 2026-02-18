export type ChatCardType = "text" | "image" | "file" | "system" | "todo" | "quote";

export interface ChatMessage {
  id: string;
  seq: number;
  type: ChatCardType;
  timestamp: number;
  payload: Record<string, unknown>;
}
