export type SSEEventType =
  | "thinking_start"
  | "thinking_delta"
  | "text_start"
  | "text_delta"
  | "tool_start"
  | "tool_input_delta"
  | "tool_result"
  | "usage"
  | "error"
  | "done";

export interface SSEEvent {
  type: SSEEventType;
  data?: Record<string, unknown>;
}

export interface ChatToolCall {
  id: string;
  toolName: string;
  input: string;
  result?: string;
  isError?: boolean;
  duration?: number;
  isStreaming?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingContent?: string;
  toolCalls: ChatToolCall[];
  isStreaming?: boolean;
  createdAt: Date;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  totalCost: number;
}
