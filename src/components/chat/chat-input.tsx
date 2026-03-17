"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, CornerDownLeft, Plus } from "lucide-react";
import { AgentSelector } from "./agent-selector";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onNewChat: () => void;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  selectedAgentId,
  onSelectAgent,
  onNewChat,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm px-6 py-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="relative flex items-end gap-2 rounded-xl border border-border/50 bg-background/60 p-1.5 focus-within:border-primary/30 focus-within:glow-primary-sm transition-all">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Select an agent to start chatting..."
                : "Send a message..."
            }
            className="min-h-11 max-h-50 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40"
            rows={1}
            disabled={disabled}
          />
          {isStreaming ? (
            <Button
              onClick={onStop}
              variant="destructive"
              size="icon"
              className="shrink-0 h-9 w-9 rounded-lg"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              size="icon"
              className="shrink-0 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AgentSelector
              selectedAgentId={selectedAgentId}
              onSelect={onSelectAgent}
              disabled={isStreaming}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              disabled={isStreaming}
              className="text-muted-foreground hover:text-foreground h-9"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <CornerDownLeft className="h-2.5 w-2.5" />
            <span>Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
