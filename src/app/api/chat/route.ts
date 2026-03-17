import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAgentConfig } from "@/lib/agents/agent-registry";
import { runAgentStream } from "@/lib/agents/base-agent";
import { SSEEvent } from "@/types/chat";
import { sanitizeInput } from "@/lib/security/sanitizer";
import { detectInjection } from "@/lib/security/injection-detector";
import { filterOutput } from "@/lib/security/output-filter";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import Anthropic from "@anthropic-ai/sdk";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    // --- Rate Limiting ---
    const ip = getClientIp(req);
    const rateResult = checkRateLimit(ip);
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Try again in ${rateResult.retryAfter}s`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateResult.retryAfter),
          },
        }
      );
    }

    const body = await req.json();
    const { agentId, conversationId, message } = body as {
      agentId: string;
      conversationId?: string;
      message: string;
    };

    if (!agentId || !message) {
      return new Response(JSON.stringify({ error: "agentId and message are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Input Sanitization ---
    const { safe: sanitizedMessage, warnings: sanitizeWarnings } = sanitizeInput(message);
    if (sanitizeWarnings.length > 0) {
      console.warn(`[security] Input sanitized for ${ip}:`, sanitizeWarnings);
    }

    // --- Injection Detection ---
    const injection = detectInjection(sanitizedMessage);
    if (injection.action === "reject") {
      console.warn(
        `[security] Injection REJECTED for ${ip} (score: ${injection.score}):`,
        injection.flags
      );
      return new Response(
        JSON.stringify({
          error: "Your message was flagged as potentially harmful and has been blocked.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (injection.action === "warn") {
      console.warn(
        `[security] Injection WARNING for ${ip} (score: ${injection.score}):`,
        injection.flags
      );
    }

    // Load agent config
    const config = await getAgentConfig(agentId);
    if (!config) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conversation = await prisma.conversation.create({
        data: {
          agentId,
          title: sanitizedMessage.slice(0, 100),
        },
      });
      convId = conversation.id;
    }

    // Save user message (sanitized)
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "user",
        content: sanitizedMessage,
      },
    });

    // Load conversation history
    const dbMessages = await prisma.message.findMany({
      where: { conversationId: convId },
      include: { toolCalls: true },
      orderBy: { createdAt: "asc" },
    });

    // Build Anthropic message history
    const anthropicMessages: Anthropic.Messages.MessageParam[] = [];
    for (const msg of dbMessages) {
      if (msg.role === "user") {
        anthropicMessages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        // Reconstruct assistant message with tool calls
        const blocks: Anthropic.Messages.ContentBlockParam[] = [];
        if (msg.content) {
          blocks.push({ type: "text", text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          blocks.push({
            type: "tool_use",
            id: tc.toolId,
            name: tc.toolName,
            input: JSON.parse(tc.input),
          });
        }
        if (blocks.length > 0) {
          anthropicMessages.push({ role: "assistant", content: blocks });
        }

        // Add tool results as user messages
        if (msg.toolCalls.length > 0) {
          anthropicMessages.push({
            role: "user",
            content: msg.toolCalls.map((tc) => ({
              type: "tool_result" as const,
              tool_use_id: tc.toolId,
              content: tc.result,
              is_error: tc.isError,
            })),
          });
        }
      }
    }

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendSSE = (event: SSEEvent) => {
      // --- Output Filtering ---
      // Filter text_delta events for sensitive data
      if (event.type === "text_delta" && event.data?.text) {
        const { filtered, redactions } = filterOutput(event.data.text as string);
        if (redactions.length > 0) {
          console.warn(`[security] Output redacted:`, redactions);
          event = { ...event, data: { ...event.data, text: filtered } };
        }
      }

      const data = JSON.stringify(event);
      writer.write(encoder.encode(`data: ${data}\n\n`));
    };

    // Send conversation ID immediately
    sendSSE({
      type: "text_start",
      data: { conversationId: convId },
    });

    // Run agent in background
    const startTime = Date.now();

    (async () => {
      try {
        const result = await runAgentStream(
          config,
          anthropicMessages,
          { agentId, conversationId: convId!, resources: {} },
          sendSSE
        );

        // Filter the final assistant content before saving
        const { filtered: filteredContent } = filterOutput(result.assistantContent);

        // Save assistant message to DB
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId: convId!,
            role: "assistant",
            content: filteredContent,
            thinkingContent: result.thinkingContent || null,
          },
        });

        // Save tool calls
        if (result.toolCalls.length > 0) {
          await prisma.toolCall.createMany({
            data: result.toolCalls.map((tc) => ({
              messageId: assistantMessage.id,
              toolName: tc.toolName,
              toolId: tc.id,
              input: tc.input,
              result: tc.result,
              isError: tc.isError,
              duration: tc.duration,
            })),
          });
        }

        // Log usage
        const latency = Date.now() - startTime;
        await prisma.usageLog.create({
          data: {
            agentId,
            conversationId: convId,
            model: config.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            thinkingTokens: result.usage.thinkingTokens,
            totalCost: result.usage.totalCost,
            latency,
            toolCallCount: result.toolCalls.length,
            iterations: result.usage.iterations,
            success: true,
          },
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        sendSSE({ type: "error", data: { message: errMsg } });

        // Log failed usage
        const latency = Date.now() - startTime;
        await prisma.usageLog.create({
          data: {
            agentId,
            conversationId: convId,
            model: config.model,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            latency,
            success: false,
            errorMessage: errMsg,
          },
        });
      } finally {
        writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(rateResult.remaining),
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
