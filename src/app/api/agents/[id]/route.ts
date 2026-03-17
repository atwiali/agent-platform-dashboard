import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      _count: { select: { conversations: true, usageLogs: true, evalTestCases: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Only allow updating safe fields
  const allowedFields = [
    "name",
    "description",
    "systemPrompt",
    "model",
    "maxTokens",
    "temperature",
    "useThinking",
    "thinkingBudget",
    "maxIterations",
    "isActive",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  try {
    const agent = await prisma.agent.update({
      where: { id },
      data,
    });
    return NextResponse.json(agent);
  } catch {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check if agent has conversations
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { _count: { select: { conversations: true } } },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent._count.conversations > 0) {
    // Soft delete — just deactivate
    await prisma.agent.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true, deactivated: true });
  }

  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
