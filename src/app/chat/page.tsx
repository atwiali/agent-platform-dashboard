import { Suspense } from "react";
import { ChatContainer } from "@/components/chat/chat-container";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <ChatContainer />
    </Suspense>
  );
}
