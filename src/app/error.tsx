"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || "An unexpected error occurred"}
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/40 font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={reset} variant="outline" className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
