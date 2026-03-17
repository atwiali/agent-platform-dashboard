import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      model: true,
      useThinking: true,
      maxIterations: true,
      isActive: true,
      _count: { select: { conversations: true } },
    },
  });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const agent = await prisma.agent.create({ data: body });
  return NextResponse.json(agent, { status: 201 });
}
