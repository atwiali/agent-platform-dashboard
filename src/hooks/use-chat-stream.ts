"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage, ChatToolCall, SSEEvent } from "@/types/chat";

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (agentId: string, message: string) => {
      setError(null);
      setIsStreaming(true);

      // Add user message optimistically
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message,
        toolCalls: [],
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Create assistant message placeholder
      const assistantId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        thinkingContent: "",
        toolCalls: [],
        isStreaming: true,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            conversationId,
            message,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Chat request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            let event: SSEEvent;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            handleSSEEvent(event, assistantId);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled
        } else {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg);
        }
      } finally {
        // Mark assistant message as done streaming
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg
          )
        );
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId]
  );

  const handleSSEEvent = useCallback(
    (event: SSEEvent, assistantId: string) => {
      const data = event.data || {};

      switch (event.type) {
        case "text_start":
          // May contain conversationId
          if (data.conversationId) {
            setConversationId(data.conversationId as string);
          }
          break;

        case "text_delta":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + (data.text as string) }
                : msg
            )
          );
          break;

        case "thinking_start":
          // Nothing to do, just mark that thinking started
          break;

        case "thinking_delta":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    thinkingContent:
                      (msg.thinkingContent || "") + (data.text as string),
                  }
                : msg
            )
          );
          break;

        case "tool_start": {
          const newToolCall: ChatToolCall = {
            id: data.id as string,
            toolName: data.name as string,
            input: "",
            isStreaming: true,
          };
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, toolCalls: [...msg.toolCalls, newToolCall] }
                : msg
            )
          );
          break;
        }

        case "tool_input_delta":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    toolCalls: msg.toolCalls.map((tc) =>
                      tc.isStreaming
                        ? { ...tc, input: tc.input + (data.json as string) }
                        : tc
                    ),
                  }
                : msg
            )
          );
          break;

        case "tool_result":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    toolCalls: msg.toolCalls.map((tc) =>
                      tc.id === (data.id as string)
                        ? {
                            ...tc,
                            result: data.result as string,
                            isError: data.isError as boolean,
                            duration: data.duration as number,
                            isStreaming: false,
                          }
                        : tc
                    ),
                  }
                : msg
            )
          );
          break;

        case "error":
          setError(data.message as string);
          break;

        case "done":
          // Streaming complete
          break;
      }
    },
    []
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();

      setConversationId(convId);
      setMessages(
        data.messages.map(
          (msg: {
            id: string;
            role: "user" | "assistant";
            content: string;
            thinkingContent?: string;
            toolCalls: Array<{
              toolId: string;
              toolName: string;
              input: string;
              result: string;
              isError: boolean;
              duration: number;
            }>;
            createdAt: string;
          }) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            thinkingContent: msg.thinkingContent,
            toolCalls: msg.toolCalls.map((tc) => ({
              id: tc.toolId,
              toolName: tc.toolName,
              input: tc.input,
              result: tc.result,
              isError: tc.isError,
              duration: tc.duration,
            })),
            createdAt: new Date(msg.createdAt),
          })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadConversation,
  };
}
