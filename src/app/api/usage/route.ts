import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const agentId = searchParams.get("agentId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const granularity = searchParams.get("granularity") || "day"; // day | hour

  // Build date filter
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  // If no date range, default to last 30 days
  if (!from && !to) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter.gte = thirtyDaysAgo;
  }

  const where = {
    ...(agentId ? { agentId } : {}),
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
  };

  // Get all usage logs within range
  const logs = await prisma.usageLog.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { agent: { select: { name: true, slug: true } } },
  });

  // Aggregate summary stats
  const summary = {
    totalCalls: logs.length,
    totalCost: logs.reduce((sum, l) => sum + l.totalCost, 0),
    totalInputTokens: logs.reduce((sum, l) => sum + l.inputTokens, 0),
    totalOutputTokens: logs.reduce((sum, l) => sum + l.outputTokens, 0),
    totalThinkingTokens: logs.reduce((sum, l) => sum + l.thinkingTokens, 0),
    avgLatency:
      logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + l.latency, 0) / logs.length)
        : 0,
    errorCount: logs.filter((l) => !l.success).length,
    successRate:
      logs.length > 0
        ? ((logs.filter((l) => l.success).length / logs.length) * 100).toFixed(1)
        : "100",
  };

  // Time series data grouped by granularity
  const timeSeriesMap = new Map<
    string,
    {
      date: string;
      calls: number;
      cost: number;
      inputTokens: number;
      outputTokens: number;
      avgLatency: number;
      errors: number;
      _latencySum: number;
    }
  >();

  for (const log of logs) {
    const d = new Date(log.createdAt);
    let key: string;
    if (granularity === "hour") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:00`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const existing = timeSeriesMap.get(key) || {
      date: key,
      calls: 0,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      avgLatency: 0,
      errors: 0,
      _latencySum: 0,
    };

    existing.calls += 1;
    existing.cost += log.totalCost;
    existing.inputTokens += log.inputTokens;
    existing.outputTokens += log.outputTokens;
    existing._latencySum += log.latency;
    existing.avgLatency = Math.round(existing._latencySum / existing.calls);
    if (!log.success) existing.errors += 1;

    timeSeriesMap.set(key, existing);
  }

  const timeSeries = Array.from(timeSeriesMap.values()).map(
    ({ _latencySum, ...rest }) => rest
  );

  // Per-agent breakdown
  const agentMap = new Map<
    string,
    {
      agentId: string;
      agentName: string;
      agentSlug: string;
      calls: number;
      cost: number;
      inputTokens: number;
      outputTokens: number;
      avgLatency: number;
      errors: number;
      _latencySum: number;
    }
  >();

  for (const log of logs) {
    const existing = agentMap.get(log.agentId) || {
      agentId: log.agentId,
      agentName: log.agent.name,
      agentSlug: log.agent.slug,
      calls: 0,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      avgLatency: 0,
      errors: 0,
      _latencySum: 0,
    };

    existing.calls += 1;
    existing.cost += log.totalCost;
    existing.inputTokens += log.inputTokens;
    existing.outputTokens += log.outputTokens;
    existing._latencySum += log.latency;
    existing.avgLatency = Math.round(existing._latencySum / existing.calls);
    if (!log.success) existing.errors += 1;

    agentMap.set(log.agentId, existing);
  }

  const agentBreakdown = Array.from(agentMap.values())
    .map(({ _latencySum, ...rest }) => rest)
    .sort((a, b) => b.cost - a.cost);

  return NextResponse.json({
    summary,
    timeSeries,
    agentBreakdown,
  });
}
