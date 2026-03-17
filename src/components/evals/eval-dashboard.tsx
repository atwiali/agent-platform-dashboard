"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FlaskConical,
  Plus,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Agent {
  id: string;
  slug: string;
  name: string;
}

interface TestCase {
  id: string;
  agentId: string;
  name: string;
  input: string;
  criteria: string;
  isActive: boolean;
  agent: { name: string; slug: string };
}

interface EvalRun {
  id: string;
  agentId: string;
  status: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  totalCost: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  agent: { name: string };
}

const CRITERIA_TYPES = [
  { value: "contains", label: "Contains text" },
  { value: "not_contains", label: "Does not contain" },
  { value: "regex", label: "Matches regex" },
  { value: "tool_called", label: "Tool was called" },
  { value: "no_tool_called", label: "Tool was not called" },
  { value: "json_schema", label: "JSON has keys" },
];

export function EvalDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [recentRuns, setRecentRuns] = useState<EvalRun[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formAgentId, setFormAgentId] = useState("");
  const [formName, setFormName] = useState("");
  const [formInput, setFormInput] = useState("");
  const [formCriteria, setFormCriteria] = useState<
    Array<{ type: string; value: string }>
  >([{ type: "contains", value: "" }]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, testCasesRes, runsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/evals"),
        fetch("/api/evals/runs/recent"),
      ]);
      if (agentsRes.ok) setAgents(await agentsRes.json());
      if (testCasesRes.ok) setTestCases(await testCasesRes.json());
      if (runsRes.ok) setRecentRuns(await runsRes.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Also fetch runs from the eval run list endpoint
  useEffect(() => {
    fetch("/api/evals/runs/recent")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecentRuns)
      .catch(() => {});
  }, []);

  const handleCreateTestCase = async () => {
    if (!formAgentId || !formName || !formInput || formCriteria.some((c) => !c.value)) {
      setError("Please fill all fields");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/evals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: formAgentId,
          name: formName,
          input: formInput,
          criteria: formCriteria,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Reset form and refresh
      setShowForm(false);
      setFormName("");
      setFormInput("");
      setFormCriteria([{ type: "contains", value: "" }]);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test case");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTestCase = async (id: string) => {
    try {
      await fetch(`/api/evals?id=${id}`, { method: "DELETE" });
      setTestCases((prev) => prev.filter((tc) => tc.id !== id));
    } catch {
      // ignore
    }
  };

  const handleRunEval = async (agentId: string) => {
    setIsRunning(agentId);
    setError(null);

    try {
      const res = await fetch("/api/evals/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Refresh data after run completes
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval run failed");
    } finally {
      setIsRunning(null);
    }
  };

  const addCriterion = () => {
    setFormCriteria((prev) => [...prev, { type: "contains", value: "" }]);
  };

  const removeCriterion = (index: number) => {
    setFormCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCriterion = (
    index: number,
    field: "type" | "value",
    val: string
  ) => {
    setFormCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c))
    );
  };

  // Group test cases by agent
  const agentTestCases = new Map<string, TestCase[]>();
  for (const tc of testCases) {
    const list = agentTestCases.get(tc.agentId) || [];
    list.push(tc);
    agentTestCases.set(tc.agentId, list);
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Evaluation Suite
            </h1>
            <p className="text-sm text-muted-foreground">
              Define test cases and track agent performance over time
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            New Test Case
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Create Test Case</CardTitle>
              <CardDescription>
                Define an input and criteria to evaluate agent behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Agent
                  </label>
                  <Select
                    value={formAgentId}
                    onValueChange={(v) => {
                      if (v) setFormAgentId(v);
                    }}
                  >
                    <SelectTrigger className="bg-background/50 border-border/40">
                      <SelectValue placeholder="Select agent..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Test Name
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Can read a file correctly"
                    className="bg-background/50 border-border/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Input Message
                </label>
                <Textarea
                  value={formInput}
                  onChange={(e) => setFormInput(e.target.value)}
                  placeholder="The message to send to the agent..."
                  rows={3}
                  className="bg-background/50 border-border/40 resize-none"
                />
              </div>

              {/* Criteria */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Pass Criteria
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addCriterion}
                    className="text-xs text-primary"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                {formCriteria.map((criterion, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={criterion.type}
                      onValueChange={(v) => {
                        if (v) updateCriterion(i, "type", v);
                      }}
                    >
                      <SelectTrigger className="w-48 bg-background/50 border-border/40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                        {CRITERIA_TYPES.map((ct) => (
                          <SelectItem key={ct.value} value={ct.value}>
                            {ct.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={criterion.value}
                      onChange={(e) => updateCriterion(i, "value", e.target.value)}
                      placeholder="Value..."
                      className="flex-1 bg-background/50 border-border/40 text-xs"
                    />
                    {formCriteria.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCriterion(i)}
                        className="h-8 w-8 text-muted-foreground/50 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTestCase}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Create Test Case
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Cases by Agent */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Test Cases</CardTitle>
              </div>
              <CardDescription>
                {testCases.length} test case{testCases.length !== 1 ? "s" : ""} across{" "}
                {agentTestCases.size} agent{agentTestCases.size !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FlaskConical className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No test cases yet
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Create a test case to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(agentTestCases.entries()).map(
                    ([agentId, cases]) => (
                      <div key={agentId}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-muted-foreground/60">
                            {cases[0].agent.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRunEval(agentId)}
                            disabled={isRunning !== null}
                            className="text-xs text-primary h-7"
                          >
                            {isRunning === agentId ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="mr-1 h-3 w-3" />
                            )}
                            Run All
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          {cases.map((tc) => {
                            const criteria = JSON.parse(tc.criteria) as Array<{
                              type: string;
                              value: string;
                            }>;
                            return (
                              <div
                                key={tc.id}
                                className="group flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">
                                    {tc.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {criteria.map((c, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-[9px] font-mono bg-background/30 border-border/40 text-foreground/50"
                                      >
                                        {c.type}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTestCase(tc.id)}
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Runs */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Recent Runs</CardTitle>
              </div>
              <CardDescription>Evaluation batch run history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No eval runs yet
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Run evaluations to track agent quality
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRuns.map((run) => {
                    const passRate =
                      run.totalCases > 0
                        ? (
                            (run.passedCases / run.totalCases) *
                            100
                          ).toFixed(0)
                        : "0";
                    return (
                      <Link
                        key={run.id}
                        href={`/evals/runs/${run.id}`}
                        className="group flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {run.agent.name}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {run.passedCases}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-red-400">
                              <XCircle className="h-2.5 w-2.5" />
                              {run.failedCases}
                            </span>
                            <span className="text-[11px] text-muted-foreground/50 font-mono">
                              ${run.totalCost.toFixed(4)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <Badge
                              variant="secondary"
                              className={
                                run.status === "complete"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                                  : run.status === "failed"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20 text-[10px]"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
                              }
                            >
                              {run.status}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">
                              {passRate}% pass
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
