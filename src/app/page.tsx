import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Bot,
  Activity,
  ArrowRight,
  Zap,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const [agentCount, conversationCount, usageSummary, recentConversations] =
    await Promise.all([
      prisma.agent.count({ where: { isActive: true } }),
      prisma.conversation.count(),
      prisma.usageLog.aggregate({
        _sum: { totalCost: true },
        _count: true,
      }),
      prisma.conversation.findMany({
        include: {
          agent: { select: { name: true, slug: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your AI agent platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Agents
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{agentCount}</div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Configured and ready
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Conversations
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversationCount}</div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Total interactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                API Calls
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Activity className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {usageSummary._count ?? 0}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Total requests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Cost
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(usageSummary._sum.totalCost ?? 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                All time spend
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Recent */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Start */}
          <Card className="bg-linear-to-br from-primary/10 via-card/50 to-card/50 border-primary/20 glow-primary-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Jump into a conversation with any agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start New Chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Recent Conversations</CardTitle>
              <CardDescription>Latest agent interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentConversations.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/chat?conversation=${conv.id}`}
                      className="flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-3 hover:bg-accent/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title || "Untitled"}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">
                          {conv.agent.name} &middot; {conv._count.messages}{" "}
                          msgs
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
