"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Search,
  Trash2,
  MoreHorizontal,
  Clock,
  Bot,
  Sparkles,
  Code,
  FileText,
  Cpu,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string | null;
  agentId: string;
  createdAt: string;
  updatedAt: string;
  agent: { name: string; slug: string };
  _count: { messages: number };
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  "cli-assistant": Sparkles,
  "code-review": Code,
  "rag-docs": FileText,
  "app-generator": Cpu,
};

const AGENT_COLORS: Record<string, string> = {
  "cli-assistant": "text-violet-400",
  "code-review": "text-emerald-400",
  "rag-docs": "text-amber-400",
  "app-generator": "text-sky-400",
};

interface ConversationSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string, agentId: string) => void;
  onDeleteConversation: (id: string) => void;
  refreshTrigger: number;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  refreshTrigger,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        onDeleteConversation(id);
      }
    } catch {
      // silently fail
    }
  };

  const filtered = search.trim()
    ? conversations.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
          c.agent.name.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  // Group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: Conversation[] }[] = [];
  const todayItems: Conversation[] = [];
  const yesterdayItems: Conversation[] = [];
  const weekItems: Conversation[] = [];
  const olderItems: Conversation[] = [];

  for (const c of filtered) {
    const d = new Date(c.updatedAt);
    if (d >= today) todayItems.push(c);
    else if (d >= yesterday) yesterdayItems.push(c);
    else if (d >= weekAgo) weekItems.push(c);
    else olderItems.push(c);
  }

  if (todayItems.length) groups.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems });
  if (weekItems.length) groups.push({ label: "This Week", items: weekItems });
  if (olderItems.length) groups.push({ label: "Older", items: olderItems });

  return (
    <div className="flex h-full w-72 flex-col border-r border-border/50 bg-card/20">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground mb-2.5">
          Conversations
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-8 pl-8 text-xs bg-background/50 border-border/40 placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <p className="mt-3 text-xs text-muted-foreground/60">Loading...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground/60">
                {search ? "No matching conversations" : "No conversations yet"}
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">
                {search ? "Try a different search" : "Start chatting to see history here"}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.label}
                </p>
                {group.items.map((conv) => {
                  const Icon = AGENT_ICONS[conv.agent.slug] || Bot;
                  const colorClass = AGENT_COLORS[conv.agent.slug] || "text-primary";
                  const isActive = conv.id === activeConversationId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id, conv.agentId)}
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        "group relative flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", colorClass)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium leading-tight">
                          {conv.title || "Untitled"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/50">
                          <span>{conv.agent.name}</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(conv.updatedAt)}
                          </span>
                        </div>
                      </div>
                      {/* Delete button on hover */}
                      {(hoveredId === conv.id || isActive) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => handleDelete(e, conv.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="border-t border-border/50 px-4 py-2.5">
        <p className="text-[10px] text-muted-foreground/40">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
