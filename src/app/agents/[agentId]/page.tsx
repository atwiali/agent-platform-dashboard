import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AgentConfigForm } from "@/components/agents/agent-config-form";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      _count: {
        select: {
          conversations: true,
          usageLogs: true,
          evalTestCases: true,
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  return <AgentConfigForm agent={agent} />;
}
