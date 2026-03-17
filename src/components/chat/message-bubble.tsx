"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/types/chat";
import { ThinkingBlock } from "./thinking-block";
import { ToolCallBlock } from "./tool-call-block";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-muted text-muted-foreground"
            : "bg-primary/15 text-primary glow-primary-sm"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : ""}`}>
        {/* Role label */}
        <p
          className={`text-[11px] font-medium uppercase tracking-wider ${
            isUser
              ? "text-right text-muted-foreground/60"
              : "text-primary/70"
          }`}
        >
          {isUser ? "You" : "Agent"}
        </p>

        {isUser ? (
          <div className="rounded-2xl rounded-tr-md bg-primary/10 border border-primary/10 px-4 py-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {message.thinkingContent && (
              <ThinkingBlock content={message.thinkingContent} />
            )}

            {message.toolCalls.map((tc) => (
              <ToolCallBlock key={tc.id} toolCall={tc} />
            ))}

            {message.content && (
              <div className="rounded-2xl rounded-tl-md bg-card border border-border/50 px-4 py-3">
                <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/50 prose-pre:border prose-pre:border-border/50 prose-code:text-primary prose-code:font-mono prose-code:text-xs prose-headings:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {message.isStreaming &&
              !message.content &&
              message.toolCalls.length === 0 && (
                <div className="rounded-2xl rounded-tl-md bg-card border border-border/50 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
