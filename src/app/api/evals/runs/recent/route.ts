import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const runs = await prisma.evalRun.findMany({
    include: { agent: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(runs);
}
