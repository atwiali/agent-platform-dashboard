"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Coins, Zap, Timer } from "lucide-react";

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

const AGENT_COLORS: Record<string, string> = {
  "cli-assistant": "#a78bfa",
  "code-review": "#34d399",
  "rag-docs": "#fbbf24",
  "app-generator": "#38bdf8",
};

const PIE_COLORS = ["#a78bfa", "#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#fb923c"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-1.5">
        {label ? formatDate(label) : ""}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {entry.name === "Cost"
              ? `$${entry.value.toFixed(4)}`
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CostChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-base">Cost Over Time</CardTitle>
        </div>
        <CardDescription>Daily API spend across all agents</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground/50">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(0 0% 20%)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v.toFixed(2)}`}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cost"
                name="Cost"
                stroke="#34d399"
                fill="url(#costGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TokenChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Token Usage</CardTitle>
        </div>
        <CardDescription>Daily input and output tokens</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground/50">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(0 0% 20%)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="inputTokens"
                name="Input Tokens"
                fill="#a78bfa"
                radius={[2, 2, 0, 0]}
                stackId="tokens"
              />
              <Bar
                dataKey="outputTokens"
                name="Output Tokens"
                fill="#38bdf8"
                radius={[2, 2, 0, 0]}
                stackId="tokens"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function LatencyChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-amber-400" />
          <CardTitle className="text-base">Latency Trend</CardTitle>
        </div>
        <CardDescription>Average response time per day</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground/50">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(0 0% 20%)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}ms`}
                tick={{ fill: "hsl(0 0% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="avgLatency"
                name="Avg Latency"
                stroke="#fbbf24"
                fill="url(#latencyGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AgentCostPieChart({ data }: { data: AgentBreakdown[] }) {
  const total = data.reduce((sum, d) => sum + d.cost, 0);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Cost by Agent</CardTitle>
        </div>
        <CardDescription>Spend distribution across agents</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground/50">
            No data yet
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="cost"
                  nameKey="agentName"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={entry.agentId}
                      fill={
                        AGENT_COLORS[entry.agentSlug] ||
                        PIE_COLORS[i % PIE_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {data.map((entry, i) => {
                const pct = total > 0 ? ((entry.cost / total) * 100).toFixed(1) : "0";
                return (
                  <div key={entry.agentId} className="flex items-center gap-2.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          AGENT_COLORS[entry.agentSlug] ||
                          PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-foreground/80 flex-1 truncate">
                      {entry.agentName}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      ${entry.cost.toFixed(4)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/50 w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
