"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Loader2,
  Brain,
  Cpu,
  Settings2,
  FileText,
  Wrench,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface AgentData {
  id: string;
  slug: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number | null;
  tools: string;
  useThinking: boolean;
  thinkingBudget: number | null;
  maxIterations: number;
  isActive: boolean;
  _count: {
    conversations: number;
    usageLogs: number;
    evalTestCases: number;
  };
}

const MODELS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
  { value: "claude-haiku-4-20250506", label: "Claude Haiku 4" },
];

export function AgentConfigForm({ agent }: { agent: AgentData }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [model, setModel] = useState(agent.model);
  const [maxTokens, setMaxTokens] = useState(agent.maxTokens);
  const [temperature, setTemperature] = useState(agent.temperature ?? 0);
  const [useThinking, setUseThinking] = useState(agent.useThinking);
  const [thinkingBudget, setThinkingBudget] = useState(agent.thinkingBudget ?? 10000);
  const [maxIterations, setMaxIterations] = useState(agent.maxIterations);
  const [isActive, setIsActive] = useState(agent.isActive);

  const tools = JSON.parse(agent.tools) as Array<{ name: string; description?: string }>;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
          model,
          maxTokens,
          temperature: temperature || null,
          useThinking,
          thinkingBudget: useThinking ? thinkingBudget : null,
          maxIterations,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
      router.refresh();
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/agents">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{agent.name}</h1>
              <p className="text-xs text-muted-foreground/60 font-mono">{agent.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === "success" && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {errorMessage}
              </span>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-2 h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
          <span>
            {agent._count.conversations} conversation{agent._count.conversations !== 1 ? "s" : ""}
          </span>
          <span>
            {agent._count.usageLogs} API call{agent._count.usageLogs !== 1 ? "s" : ""}
          </span>
          <span>
            {agent._count.evalTestCases} test case{agent._count.evalTestCases !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Basic Info</CardTitle>
              </div>
              <CardDescription>Agent identity and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-background/50 border-border/40 resize-none"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-[11px] text-muted-foreground/60">
                    Agent is available for conversations
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    isActive ? "bg-emerald-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Model Settings */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Model Settings</CardTitle>
              </div>
              <CardDescription>LLM configuration and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Model
                </label>
                <Select value={model} onValueChange={(value) => { if (value) setModel(value); }}>
                  <SelectTrigger className="bg-background/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                    {MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Max Tokens
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    min={1}
                    max={128000}
                    className="bg-background/50 border-border/40 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Max Iterations
                  </label>
                  <Input
                    type="number"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="bg-background/50 border-border/40 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Temperature
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-10 text-right text-sm font-mono text-foreground/70">
                    {temperature.toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thinking Settings */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-base">Extended Thinking</CardTitle>
              </div>
              <CardDescription>
                Enable Claude&apos;s chain-of-thought reasoning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-3">
                <div>
                  <p className="text-sm font-medium">Enable Thinking</p>
                  <p className="text-[11px] text-muted-foreground/60">
                    Shows reasoning process before answering
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useThinking}
                  onClick={() => setUseThinking(!useThinking)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    useThinking ? "bg-amber-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                      useThinking ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {useThinking && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Thinking Budget (tokens)
                  </label>
                  <Input
                    type="number"
                    value={thinkingBudget}
                    onChange={(e) => setThinkingBudget(Number(e.target.value))}
                    min={1000}
                    max={100000}
                    step={1000}
                    className="bg-background/50 border-border/40 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground/40">
                    Maximum tokens for reasoning (1,000 - 100,000)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Tools</CardTitle>
              </div>
              <CardDescription>
                Available tools for this agent (configured in code)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tools.length === 0 ? (
                <p className="text-sm text-muted-foreground/60">No tools configured</p>
              ) : (
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-start gap-2.5 rounded-lg border border-border/30 bg-background/30 p-3"
                    >
                      <Wrench className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-background/30 border-border/40 text-foreground/60"
                        >
                          {tool.name}
                        </Badge>
                        {tool.description && (
                          <p className="mt-1 text-[11px] text-muted-foreground/50 leading-relaxed">
                            {tool.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[10px] text-muted-foreground/40">
                Tool definitions are managed in code. Edit the agent config files to add or remove tools.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Prompt — full width */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">System Prompt</CardTitle>
            </div>
            <CardDescription>
              Instructions that define the agent&apos;s behavior and personality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={16}
              className="bg-background/50 border-border/40 font-mono text-xs leading-relaxed resize-y"
            />
            <p className="mt-2 text-[10px] text-muted-foreground/40">
              {systemPrompt.length} characters
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
