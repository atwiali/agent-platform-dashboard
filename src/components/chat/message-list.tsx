"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sparkles } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">Start a conversation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select an agent below and send a message to begin
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground/60">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              Streaming responses
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Tool execution
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
