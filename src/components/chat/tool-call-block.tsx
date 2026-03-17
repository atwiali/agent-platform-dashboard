"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ChatToolCall } from "@/types/chat";

interface ToolCallBlockProps {
  toolCall: ChatToolCall;
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatInput = (input: string) => {
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch {
      return input;
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-accent/30 transition-all"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <Wrench className="h-3 w-3 text-primary" />
        </div>
        <span className="font-mono text-xs font-medium text-foreground/80">
          {toolCall.toolName}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {toolCall.duration !== undefined && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
              <Clock className="h-2.5 w-2.5" />
              {toolCall.duration}ms
            </span>
          )}

          {toolCall.isStreaming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : toolCall.isError ? (
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}

          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/30 divide-y divide-border/30">
          {toolCall.input && (
            <div className="px-3.5 py-2.5">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Input
              </div>
              <pre className="text-xs bg-background/50 rounded-lg p-2.5 overflow-x-auto font-mono text-foreground/70 border border-border/30">
                {formatInput(toolCall.input)}
              </pre>
            </div>
          )}
          {toolCall.result !== undefined && (
            <div className="px-3.5 py-2.5">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Result
              </div>
              <pre
                className={`text-xs rounded-lg p-2.5 overflow-x-auto font-mono border ${
                  toolCall.isError
                    ? "bg-red-500/5 text-red-300/80 border-red-500/20"
                    : "bg-background/50 text-foreground/70 border-border/30"
                }`}
              >
                {toolCall.result.length > 2000
                  ? toolCall.result.slice(0, 2000) + "\n... (truncated)"
                  : toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
