import Anthropic from "@anthropic-ai/sdk";

export interface ToolHandler {
  name: string;
  execute: (
    input: Record<string, unknown>,
    context: AgentContext
  ) => Promise<string>;
}

export interface AgentContext {
  agentId: string;
  conversationId: string;
  resources: Record<string, unknown>;
}

export interface AgentConfig {
  id: string;
  slug: string;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  tools: Anthropic.Messages.Tool[];
  toolHandlers: Map<string, ToolHandler>;
  useThinking: boolean;
  thinkingBudget?: number;
  maxIterations: number;
  temperature?: number;
}
