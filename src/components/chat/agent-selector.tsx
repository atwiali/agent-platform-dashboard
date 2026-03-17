"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Sparkles, Code, FileText, Cpu } from "lucide-react";

interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  "cli-assistant": Sparkles,
  "code-review": Code,
  "rag-docs": FileText,
  "app-generator": Cpu,
};

interface AgentSelectorProps {
  selectedAgentId: string | null;
  onSelect: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentSelector({
  selectedAgentId,
  onSelect,
  disabled,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then(setAgents)
      .catch(console.error);
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const SelectedIcon = selectedAgent
    ? AGENT_ICONS[selectedAgent.slug] || Bot
    : null;

  return (
    <Select
      value={selectedAgentId ?? ""}
      onValueChange={(value) => {
        if (value) onSelect(value);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-52 bg-card/50 border-border/50 backdrop-blur-sm">
        {selectedAgent ? (
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="h-3.5 w-3.5 text-primary" />}
            <span className="text-sm font-medium">{selectedAgent.name}</span>
          </div>
        ) : (
          <SelectValue placeholder="Select an agent..." />
        )}
      </SelectTrigger>
      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
        {agents.map((agent) => {
          const Icon = AGENT_ICONS[agent.slug] || Bot;
          return (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm">{agent.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
