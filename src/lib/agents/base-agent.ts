import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { AgentConfig, AgentContext } from "@/types/agent";
import { SSEEvent } from "@/types/chat";
import { calculateCost } from "@/lib/utils/cost-calculator";

interface AgentRunResult {
  assistantContent: string;
  thinkingContent: string;
  toolCalls: Array<{
    id: string;
    toolName: string;
    input: string;
    result: string;
    isError: boolean;
    duration: number;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    totalCost: number;
    iterations: number;
  };
}

export async function runAgentStream(
  config: AgentConfig,
  messages: Anthropic.Messages.MessageParam[],
  context: AgentContext,
  onEvent: (event: SSEEvent) => void
): Promise<AgentRunResult> {
  let iterations = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalThinkingTokens = 0;
  let assistantContent = "";
  let thinkingContent = "";
  const allToolCalls: AgentRunResult["toolCalls"] = [];

  const conversationMessages = [...messages];

  while (iterations < config.maxIterations) {
    iterations++;

    const apiParams: Anthropic.Messages.MessageCreateParamsStreaming = {
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      messages: conversationMessages,
      tools: config.tools.length > 0 ? config.tools : undefined,
      stream: true,
    };

    if (config.temperature !== undefined) {
      apiParams.temperature = config.temperature;
    }

    if (config.useThinking && config.thinkingBudget) {
      apiParams.thinking = {
        type: "enabled",
        budget_tokens: config.thinkingBudget,
      };
    }

    const stream = anthropic.messages.stream(apiParams);

    let currentToolId = "";
    let currentToolName = "";
    let currentToolInput = "";
    let stopReason: string | null = null;

    const toolUseBlocks: Array<{ id: string; name: string; input: unknown }> = [];

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const block = event.content_block;
        if (block.type === "thinking") {
          onEvent({ type: "thinking_start" });
        } else if (block.type === "text") {
          onEvent({ type: "text_start" });
        } else if (block.type === "tool_use") {
          currentToolId = block.id;
          currentToolName = block.name;
          currentToolInput = "";
          onEvent({
            type: "tool_start",
            data: { id: block.id, name: block.name },
          });
        }
      } else if (event.type === "content_block_delta") {
        const delta = event.delta;
        if (delta.type === "thinking_delta") {
          thinkingContent += delta.thinking;
          onEvent({ type: "thinking_delta", data: { text: delta.thinking } });
        } else if (delta.type === "text_delta") {
          assistantContent += delta.text;
          onEvent({ type: "text_delta", data: { text: delta.text } });
        } else if (delta.type === "input_json_delta") {
          currentToolInput += delta.partial_json;
          onEvent({
            type: "tool_input_delta",
            data: { json: delta.partial_json },
          });
        }
      } else if (event.type === "content_block_stop") {
        // Track completed tool use blocks for execution
        if (currentToolId && currentToolName) {
          toolUseBlocks.push({
            id: currentToolId,
            name: currentToolName,
            input: safeParseJSON(currentToolInput),
          });
        }
      } else if (event.type === "message_delta") {
        stopReason = event.delta.stop_reason;
        if (event.usage) {
          totalOutputTokens += event.usage.output_tokens;
        }
      } else if (event.type === "message_start") {
        if (event.message.usage) {
          totalInputTokens += event.message.usage.input_tokens;
        }
      }
    }

    // Process tool calls if stop_reason is tool_use
    if (stopReason === "tool_use") {
      // Build the assistant message content for the conversation
      const assistantBlocks: Anthropic.Messages.ContentBlockParam[] = [];

      // Add text if any was generated before tool calls
      if (assistantContent) {
        assistantBlocks.push({ type: "text", text: assistantContent });
      }

      // Add tool use blocks
      for (const block of toolUseBlocks) {
        assistantBlocks.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }

      conversationMessages.push({
        role: "assistant",
        content: assistantBlocks,
      });

      // Execute each tool and collect results
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        const handler = config.toolHandlers.get(block.name);
        const startTime = Date.now();
        let result: string;
        let isError = false;

        if (!handler) {
          result = `Error: Unknown tool "${block.name}"`;
          isError = true;
        } else {
          try {
            result = await handler.execute(
              block.input as Record<string, unknown>,
              context
            );
          } catch (err) {
            result = `Error: ${err instanceof Error ? err.message : String(err)}`;
            isError = true;
          }
        }

        const duration = Date.now() - startTime;

        allToolCalls.push({
          id: block.id,
          toolName: block.name,
          input: JSON.stringify(block.input),
          result,
          isError,
          duration,
        });

        onEvent({
          type: "tool_result",
          data: { id: block.id, result, isError, duration },
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
          is_error: isError,
        });
      }

      conversationMessages.push({
        role: "user",
        content: toolResults,
      });

      // Reset for next iteration
      assistantContent = "";
      toolUseBlocks.length = 0;
      currentToolId = "";
      currentToolName = "";
      currentToolInput = "";

      // Check if we're about to hit max iterations
      if (iterations >= config.maxIterations - 1) {
        conversationMessages.push({
          role: "user",
          content:
            "You are approaching the maximum number of tool calls. Please wrap up your response and provide a final answer.",
        });
      }
    } else {
      // end_turn or max_tokens — we're done
      break;
    }
  }

  const totalCost = calculateCost(
    config.model,
    totalInputTokens,
    totalOutputTokens
  );

  onEvent({
    type: "usage",
    data: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      thinkingTokens: totalThinkingTokens,
      totalCost,
    },
  });

  onEvent({ type: "done" });

  return {
    assistantContent,
    thinkingContent,
    toolCalls: allToolCalls,
    usage: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      thinkingTokens: totalThinkingTokens,
      totalCost,
      iterations,
    },
  };
}

function safeParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
