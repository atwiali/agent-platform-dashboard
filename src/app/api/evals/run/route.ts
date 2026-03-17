import { NextRequest, NextResponse } from "next/server";
import { runEvalBatch } from "@/lib/evals/runner";

// Trigger an eval run
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { agentId, testCaseIds } = body as {
    agentId: string;
    testCaseIds?: string[];
  };

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }

  try {
    // Start the eval run (runs in the background on the server)
    const runId = await runEvalBatch(agentId, testCaseIds);
    return NextResponse.json({ runId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
