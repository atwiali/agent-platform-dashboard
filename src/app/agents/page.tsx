import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, Wrench, Sparkles, Code, FileText, Cpu, Zap, ArrowRight } from "lucide-react";

const AGENT_ICONS: Record<string, React.ElementType> = {
  "cli-assistant": Sparkles,
  "code-review": Code,
  "rag-docs": FileText,
  "app-generator": Cpu,
};

const AGENT_COLORS: Record<string, string> = {
  "cli-assistant": "text-violet-400 bg-violet-500/10",
  "code-review": "text-emerald-400 bg-emerald-500/10",
  "rag-docs": "text-amber-400 bg-amber-500/10",
  "app-generator": "text-sky-400 bg-sky-500/10",
};

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    include: { _count: { select: { conversations: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Your configured AI agents and their capabilities
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => {
            const tools = JSON.parse(agent.tools) as Array<{ name: string }>;
            const Icon = AGENT_ICONS[agent.slug] || Bot;
            const colorClass = AGENT_COLORS[agent.slug] || "text-primary bg-primary/10";

            return (
              <Link key={agent.id} href={`/agents/${agent.id}`} className="group">
                <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-200 group-hover:glow-primary-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <p className="text-[11px] text-muted-foreground/50 font-mono">
                            {agent.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {agent.useThinking && (
                          <Badge
                            variant="secondary"
                            className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
                          >
                            <Brain className="mr-1 h-2.5 w-2.5" />
                            Thinking
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                        >
                          <Zap className="mr-1 h-2.5 w-2.5" />
                          Active
                        </Badge>
                        <ArrowRight className="ml-1 h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <CardDescription className="mt-2 leading-relaxed">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Model info */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        Model
                      </span>
                      <code className="text-[11px] bg-background/50 border border-border/30 px-2 py-0.5 rounded-md font-mono text-foreground/70">
                        {agent.model}
                      </code>
                    </div>

                    {/* Tools */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wrench className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                          {tools.length} Tools
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map((t) => (
                          <Badge
                            key={t.name}
                            variant="outline"
                            className="text-[10px] font-mono bg-background/30 border-border/40 text-foreground/60"
                          >
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/30 text-[11px] text-muted-foreground/50">
                      <span>
                        Max tokens:{" "}
                        <span className="text-foreground/60 font-mono">
                          {agent.maxTokens.toLocaleString()}
                        </span>
                      </span>
                      <span>
                        Max iterations:{" "}
                        <span className="text-foreground/60 font-mono">
                          {agent.maxIterations}
                        </span>
                      </span>
                      <span>
                        Conversations:{" "}
                        <span className="text-foreground/60 font-mono">
                          {agent._count.conversations}
                        </span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
