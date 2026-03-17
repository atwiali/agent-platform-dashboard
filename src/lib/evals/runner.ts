import { prisma } from "@/lib/db";
import { getAgentConfig } from "@/lib/agents/agent-registry";
import { runAgentStream } from "@/lib/agents/base-agent";
import { scoreCriteria, Criterion } from "./scorer";

export async function runEvalBatch(agentId: string, testCaseIds?: string[]) {
  // Load test cases
  const where = testCaseIds
    ? { agentId, id: { in: testCaseIds }, isActive: true }
    : { agentId, isActive: true };

  const testCases = await prisma.evalTestCase.findMany({ where });

  if (testCases.length === 0) {
    throw new Error("No active test cases found for this agent");
  }

  // Load agent config
  const config = await getAgentConfig(agentId);
  if (!config) {
    throw new Error("Agent not found");
  }

  // Create eval run
  const run = await prisma.evalRun.create({
    data: {
      agentId,
      status: "running",
      totalCases: testCases.length,
      startedAt: new Date(),
    },
  });

  // Run each test case
  let passedCount = 0;
  let failedCount = 0;
  let totalCost = 0;

  for (const testCase of testCases) {
    const startTime = Date.now();

    try {
      // Parse context if present
      const context = testCase.context ? JSON.parse(testCase.context) : {};

      // Build messages — just the test input
      const messages = [
        { role: "user" as const, content: testCase.input },
      ];

      // Add context as a system-level hint if provided
      if (context.additionalContext) {
        messages[0] = {
          role: "user",
          content: `${context.additionalContext}\n\n${testCase.input}`,
        };
      }

      // Run agent (no SSE streaming needed, just collect results)
      const result = await runAgentStream(
        config,
        messages,
        { agentId, conversationId: `eval-${run.id}`, resources: {} },
        () => {} // no-op event handler
      );

      const latency = Date.now() - startTime;
      const criteria = JSON.parse(testCase.criteria) as Criterion[];
      const toolsCalled = result.toolCalls.map((tc) => tc.toolName);

      // Score the output
      const scoring = scoreCriteria(criteria, {
        output: result.assistantContent,
        toolsCalled,
      });

      if (scoring.passed) {
        passedCount++;
      } else {
        failedCount++;
      }

      totalCost += result.usage.totalCost;

      // Save result
      await prisma.evalResult.create({
        data: {
          runId: run.id,
          testCaseId: testCase.id,
          passed: scoring.passed,
          output: result.assistantContent,
          details: JSON.stringify(scoring.details),
          latency,
          tokenUsage: JSON.stringify(result.usage),
        },
      });
    } catch (error) {
      failedCount++;
      const latency = Date.now() - startTime;

      await prisma.evalResult.create({
        data: {
          runId: run.id,
          testCaseId: testCase.id,
          passed: false,
          output: "",
          details: JSON.stringify([
            {
              type: "error",
              value: "",
              passed: false,
              reason: `Execution error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ]),
          latency,
          tokenUsage: JSON.stringify({ inputTokens: 0, outputTokens: 0, totalCost: 0 }),
        },
      });
    }
  }

  // Update run with final stats
  await prisma.evalRun.update({
    where: { id: run.id },
    data: {
      status: "complete",
      passedCases: passedCount,
      failedCases: failedCount,
      totalCost,
      completedAt: new Date(),
    },
  });

  return run.id;
}
