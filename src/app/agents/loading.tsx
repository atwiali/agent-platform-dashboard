export default function AgentsLoading() {
  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted/50 animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-muted/30 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-muted/30 animate-pulse" />
              <div className="flex gap-2 pt-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-5 w-16 rounded-full bg-muted/50 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
