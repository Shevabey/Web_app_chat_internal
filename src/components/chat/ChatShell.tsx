"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { Sidebar } from "@/components/chat/Sidebar";
import { NewChatDialog } from "@/components/chat/NewChatDialog";
import { AppHeader } from "@/components/layout/AppHeader";
import type { ConversationItem, Profile } from "@/types/db";

export function ChatShell({
  children,
  initialConversations,
  userId,
  profile,
}: {
  children: React.ReactNode;
  initialConversations: ConversationItem[];
  userId: string;
  profile: Profile;
}) {
  const pathname = usePathname();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const isConversation = pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <ChatProvider initialConversations={initialConversations} userId={userId}>
      <div className="h-dvh flex flex-col bg-bg overflow-hidden">
        <AppHeader profile={profile} />
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`shrink-0 w-full md:w-80 lg:w-80 ${
              isConversation ? "hidden md:block" : "block"
            }`}>
            <Sidebar onNewChat={() => setNewChatOpen(true)} />
          </div>
          <div
            className={`flex-1 min-w-0 ${
              isConversation ? "block" : "hidden md:block"
            }`}>
            {children}
          </div>
        </div>
      </div>
      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </ChatProvider>
  );
}
