"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  CostChart,
  TokenChart,
  LatencyChart,
  AgentCostPieChart,
} from "./usage-charts";

interface Summary {
  totalCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalThinkingTokens: number;
  avgLatency: number;
  errorCount: number;
  successRate: string;
}

interface TimeSeriesPoint {
  date: string;
  calls: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  avgLatency: number;
  errors: number;
}

interface AgentBreakdown {
  agentId: string;
  agentName: string;
  agentSlug: string;
  calls: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  avgLatency: number;
  errors: number;
}

interface UsageData {
  summary: Summary;
  timeSeries: TimeSeriesPoint[];
  agentBreakdown: AgentBreakdown[];
}

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function UsageDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    setIsLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - Number(dateRange));

    fetch(`/api/usage?from=${from.toISOString()}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeSeries, agentBreakdown } = data;

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Usage Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Track API calls, token usage, and costs across all agents
            </p>
          </div>
          <Select value={dateRange} onValueChange={(v) => { if (v) setDateRange(v); }}>
            <SelectTrigger className="w-44 bg-card/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="API Calls"
            value={summary.totalCalls.toLocaleString()}
            icon={Activity}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <StatCard
            title="Total Cost"
            value={`$${summary.totalCost.toFixed(4)}`}
            icon={DollarSign}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            title="Avg Latency"
            value={`${summary.avgLatency.toLocaleString()}ms`}
            icon={Clock}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
          />
          <StatCard
            title="Success Rate"
            value={`${summary.successRate}%`}
            subtitle={`${summary.errorCount} error${summary.errorCount !== 1 ? "s" : ""}`}
            icon={AlertCircle}
            iconColor="text-red-400"
            iconBg="bg-red-500/10"
          />
        </div>

        {/* Token summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <TokenStatCard
            title="Input Tokens"
            value={summary.totalInputTokens}
            color="text-violet-400"
          />
          <TokenStatCard
            title="Output Tokens"
            value={summary.totalOutputTokens}
            color="text-sky-400"
          />
          <TokenStatCard
            title="Thinking Tokens"
            value={summary.totalThinkingTokens}
            color="text-amber-400"
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 md:grid-cols-2">
          <CostChart data={timeSeries} />
          <TokenChart data={timeSeries} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <LatencyChart data={timeSeries} />
          <AgentCostPieChart data={agentBreakdown} />
        </div>

        {/* Agent Breakdown Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Agent Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {agentBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-8">
                No usage data yet. Start chatting with agents to see analytics.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      {[
                        "Agent",
                        "Calls",
                        "Input Tokens",
                        "Output Tokens",
                        "Cost",
                        "Avg Latency",
                        "Errors",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 ${
                            h === "Agent" ? "text-left" : "text-right"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentBreakdown.map((row) => (
                      <tr
                        key={row.agentId}
                        className="border-b border-border/20 hover:bg-accent/20 transition-colors"
                      >
                        <td className="py-3 font-medium">{row.agentName}</td>
                        <td className="py-3 text-right font-mono text-foreground/70">
                          {row.calls}
                        </td>
                        <td className="py-3 text-right font-mono text-foreground/70">
                          {row.inputTokens.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono text-foreground/70">
                          {row.outputTokens.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono text-emerald-400">
                          ${row.cost.toFixed(4)}
                        </td>
                        <td className="py-3 text-right font-mono text-foreground/70">
                          {row.avgLatency}ms
                        </td>
                        <td className="py-3 text-right font-mono text-red-400/70">
                          {row.errors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground/60 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TokenStatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
          {title}
        </p>
        <p className={`text-2xl font-bold font-mono ${color}`}>
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
