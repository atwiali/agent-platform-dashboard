import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Get run details with results
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const run = await prisma.evalRun.findUnique({
    where: { id },
    include: {
      agent: { select: { name: true, slug: true } },
      results: {
        include: {
          testCase: { select: { name: true, input: true, criteria: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}
