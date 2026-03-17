import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FlaskConical,
} from "lucide-react";

interface CriterionDetail {
  type: string;
  value: string;
  passed: boolean;
  reason: string;
}

export default async function EvalRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  const run = await prisma.evalRun.findUnique({
    where: { id: runId },
    include: {
      agent: { select: { name: true, slug: true } },
      results: {
        include: {
          testCase: { select: { name: true, input: true, criteria: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!run) notFound();

  const passRate =
    run.totalCases > 0
      ? ((run.passedCases / run.totalCases) * 100).toFixed(0)
      : "0";

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/evals">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Eval Run — {run.agent.name}
            </h1>
            <p className="text-xs text-muted-foreground/60 font-mono">
              {run.id}
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                Status
              </p>
              <Badge
                variant="secondary"
                className={
                  run.status === "complete"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : run.status === "failed"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }
              >
                {run.status}
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                Pass Rate
              </p>
              <p className="text-2xl font-bold">
                {passRate}
                <span className="text-sm font-normal text-muted-foreground ml-0.5">
                  %
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {run.passedCases}/{run.totalCases} passed
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                Total Cost
              </p>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                ${run.totalCost.toFixed(4)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                Duration
              </p>
              <p className="text-2xl font-bold">
                {run.startedAt && run.completedAt
                  ? `${((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Test Results
          </h2>

          {run.results.map((result) => {
            const details = JSON.parse(result.details) as CriterionDetail[];
            const usage = JSON.parse(result.tokenUsage) as {
              inputTokens?: number;
              outputTokens?: number;
              totalCost?: number;
            };

            return (
              <Card
                key={result.id}
                className={`bg-card/50 border-border/50 ${
                  result.passed
                    ? "border-l-2 border-l-emerald-500/50"
                    : "border-l-2 border-l-red-500/50"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {result.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <CardTitle className="text-sm">
                        {result.testCase.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {result.latency}ms
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <DollarSign className="h-2.5 w-2.5" />
                        {(usage.totalCost ?? 0).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Input */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
                      Input
                    </p>
                    <p className="text-xs text-foreground/70 bg-background/30 rounded-md p-2.5 border border-border/20">
                      {result.testCase.input}
                    </p>
                  </div>

                  {/* Output */}
                  {result.output && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
                        Output
                      </p>
                      <p className="text-xs text-foreground/70 bg-background/30 rounded-md p-2.5 border border-border/20 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {result.output.slice(0, 1000)}
                        {result.output.length > 1000 ? "..." : ""}
                      </p>
                    </div>
                  )}

                  {/* Criteria results */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">
                      Criteria
                    </p>
                    <div className="space-y-1">
                      {details.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs"
                        >
                          {d.passed ? (
                            <CheckCircle2 className="mt-0.5 h-3 w-3 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="mt-0.5 h-3 w-3 text-red-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-mono text-foreground/60">
                              {d.type}
                            </span>
                            <span className="text-muted-foreground/50">
                              {" "}
                              — {d.reason}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
