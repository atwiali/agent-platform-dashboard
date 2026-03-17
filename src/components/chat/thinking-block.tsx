"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="rounded-xl border border-amber-500/15 bg-amber-500/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-amber-400/80 hover:text-amber-400 transition-colors"
      >
        <Brain className="h-3.5 w-3.5" />
        <span className="font-medium">Thinking</span>
        <span className="ml-auto text-[10px] text-amber-400/40">
          {content.length} chars
        </span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-amber-500/10 px-3.5 py-2.5">
          <pre className="whitespace-pre-wrap text-xs text-amber-200/60 font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
