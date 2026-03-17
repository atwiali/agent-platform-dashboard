import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// List test cases (with optional agentId filter)
export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId");

  const testCases = await prisma.evalTestCase.findMany({
    where: agentId ? { agentId } : undefined,
    include: { agent: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(testCases);
}

// Create test case
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { agentId, name, input, context, criteria } = body as {
    agentId: string;
    name: string;
    input: string;
    context?: string;
    criteria: Array<{ type: string; value: string }>;
  };

  if (!agentId || !name || !input || !criteria || criteria.length === 0) {
    return NextResponse.json(
      { error: "agentId, name, input, and criteria are required" },
      { status: 400 }
    );
  }

  const testCase = await prisma.evalTestCase.create({
    data: {
      agentId,
      name,
      input,
      context: context || null,
      criteria: JSON.stringify(criteria),
    },
  });

  return NextResponse.json(testCase, { status: 201 });
}

// Delete test case
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.evalTestCase.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
