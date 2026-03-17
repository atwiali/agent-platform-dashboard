import { prisma } from "@/lib/db";
import { AgentConfig, ToolHandler } from "@/types/agent";
import Anthropic from "@anthropic-ai/sdk";

import {
  cliAssistantTools,
  cliAssistantHandlers,
} from "./configs/cli-assistant";
import { codeReviewTools, codeReviewHandlers } from "./configs/code-review";
import { ragDocsTools, ragDocsHandlers } from "./configs/rag-docs";
import { appGeneratorTools, appGeneratorHandlers } from "./configs/app-generator";

// Maps agent slugs to their code-defined tool handlers
const TOOL_HANDLER_REGISTRY: Record<string, ToolHandler[]> = {
  "cli-assistant": cliAssistantHandlers,
  "code-review": codeReviewHandlers,
  "rag-docs": ragDocsHandlers,
  "app-generator": appGeneratorHandlers,
};

// Maps agent slugs to their code-defined tool definitions (used as fallback)
const TOOL_DEFINITION_REGISTRY: Record<string, Anthropic.Messages.Tool[]> = {
  "cli-assistant": cliAssistantTools,
  "code-review": codeReviewTools,
  "rag-docs": ragDocsTools,
  "app-generator": appGeneratorTools,
};

export async function getAgentConfig(
  agentId: string
): Promise<AgentConfig | null> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || !agent.isActive) return null;

  return hydrateAgentConfig(agent);
}

export async function getAgentConfigBySlug(
  slug: string
): Promise<AgentConfig | null> {
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent || !agent.isActive) return null;

  return hydrateAgentConfig(agent);
}

export async function listAgents() {
  return prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

function hydrateAgentConfig(agent: {
  id: string;
  slug: string;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  tools: string;
  useThinking: boolean;
  thinkingBudget: number | null;
  maxIterations: number;
  temperature: number | null;
}): AgentConfig {
  // Parse tools from DB, fall back to code-defined tools
  let tools: Anthropic.Messages.Tool[];
  try {
    tools = JSON.parse(agent.tools);
  } catch {
    tools = TOOL_DEFINITION_REGISTRY[agent.slug] ?? [];
  }

  // Get code-defined handlers
  const handlers = TOOL_HANDLER_REGISTRY[agent.slug] ?? [];
  const toolHandlerMap = new Map<string, ToolHandler>();
  for (const handler of handlers) {
    toolHandlerMap.set(handler.name, handler);
  }

  return {
    id: agent.id,
    slug: agent.slug,
    systemPrompt: agent.systemPrompt,
    model: agent.model,
    maxTokens: agent.maxTokens,
    tools,
    toolHandlers: toolHandlerMap,
    useThinking: agent.useThinking,
    thinkingBudget: agent.thinkingBudget ?? undefined,
    maxIterations: agent.maxIterations,
    temperature: agent.temperature ?? undefined,
  };
}
