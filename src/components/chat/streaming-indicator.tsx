"use client";

import { Loader2, Sparkles } from "lucide-react";

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-2.5 text-xs text-primary/70 border-t border-border/30 bg-primary/2">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <Sparkles className="h-3 w-3" />
      <span className="font-medium">Agent is working...</span>
    </div>
  );
}
