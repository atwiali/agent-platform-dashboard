export default function EvalRunLoading() {
  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 rounded bg-muted animate-pulse" />
            <div className="h-3 w-32 rounded bg-muted/50 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-5">
              <div className="h-3 w-16 rounded bg-muted/50 animate-pulse mb-2" />
              <div className="h-7 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-16 w-full rounded-md bg-muted/30 animate-pulse" />
            <div className="h-12 w-full rounded-md bg-muted/30 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
