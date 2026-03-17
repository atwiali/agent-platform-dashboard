import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId");

  const conversations = await prisma.conversation.findMany({
    where: agentId ? { agentId } : undefined,
    include: {
      agent: { select: { name: true, slug: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const { agentId, title } = await req.json();
  const conversation = await prisma.conversation.create({
    data: { agentId, title },
  });
  return NextResponse.json(conversation, { status: 201 });
}
