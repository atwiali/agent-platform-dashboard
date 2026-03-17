"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChatStream } from "@/hooks/use-chat-stream";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { StreamingIndicator } from "./streaming-indicator";
import { ConversationSidebar } from "./conversation-sidebar";
import { AlertCircle, X } from "lucide-react";

export function ChatContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const {
    messages,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadConversation,
  } = useChatStream();

  // Load conversation from URL query param on mount
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      handleSelectConversation(convId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectConversation = useCallback(
    async (convId: string, agentId?: string) => {
      await loadConversation(convId);
      if (agentId) {
        setSelectedAgentId(agentId);
      } else {
        // Fetch the conversation to get agentId
        try {
          const res = await fetch(`/api/conversations/${convId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedAgentId(data.agent.id);
          }
        } catch {
          // ignore
        }
      }
      router.replace(`/chat?conversation=${convId}`, { scroll: false });
    },
    [loadConversation, router]
  );

  const handleSend = (message: string) => {
    if (!selectedAgentId) return;
    sendMessage(selectedAgentId, message);
  };

  const handleNewChat = () => {
    clearMessages();
    router.replace("/chat", { scroll: false });
    // Refresh sidebar to show any new conversations
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteConversation = (deletedId: string) => {
    if (conversationId === deletedId) {
      clearMessages();
      router.replace("/chat", { scroll: false });
    }
  };

  // Refresh sidebar when a new conversation is created (after first message sent)
  useEffect(() => {
    if (conversationId) {
      setRefreshTrigger((prev) => prev + 1);
      router.replace(`/chat?conversation=${conversationId}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return (
    <div className="flex h-full bg-background">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Error bar */}
        {error && (
          <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/5 px-6 py-2.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button className="text-red-400/60 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Messages */}
        <MessageList messages={messages} />

        {/* Streaming indicator */}
        {isStreaming && <StreamingIndicator />}

        {/* Input area with agent selector and new chat */}
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          disabled={!selectedAgentId}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}
