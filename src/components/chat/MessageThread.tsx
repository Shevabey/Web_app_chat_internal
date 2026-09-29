"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useChat } from "@/components/chat/ChatProvider";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { DayDivider } from "@/components/chat/DayDivider";
import { Composer } from "@/components/chat/Composer";
import { ThreadHeader } from "@/components/chat/ThreadHeader";
import {
  sendMessage,
  loadOlderMessages,
  markRead,
} from "@/app/(app)/chat/actions";
import { formatDayLabel, isWithin5Min } from "@/lib/format/time";
import type { ClientMessage, ConversationItem, Message } from "@/types/db";

const PAGE_SIZE = 50;

export function MessageThread({
  initialMessages,
  conversation,
  currentUserId,
  hasMore: initialHasMore,
}: {
  initialMessages: Message[];
  conversation: ConversationItem;
  currentUserId: string;
  hasMore?: boolean;
}) {
  const { onlineUsers, clearUnread, subscribeToMessages, bumpConversation } =
    useChat();
  const [messages, setMessages] = useState<ClientMessage[]>(initialMessages);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore ?? false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasNearBottom = useRef(true);

  const otherOnline = onlineUsers.has(conversation.other_id);

  // Subscribe to realtime messages for this conversation
  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      conversation.id,
      (msg: Message, event) => {
        if (event === "UPDATE") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === msg.id
                ? { ...message, read_at: msg.read_at }
                : message,
            ),
          );
          return;
        }

        setMessages((prev) => {
          // Deduplicate by id (optimistic send may already have this id)
          if (prev.some((m) => m.id === msg.id)) {
            return prev.map((m) =>
              m.id === msg.id ? { ...msg, status: "sent" as const } : m,
            );
          }
          return [...prev, msg];
        });

        // If message is from the other person, mark as read
        if (msg.sender_id !== currentUserId) {
          markRead(conversation.id).then(() => clearUnread(conversation.id));
        }
      },
    );
    return unsubscribe;
  }, [conversation.id, currentUserId, subscribeToMessages, clearUnread]);

  // Clear unread on mount
  useEffect(() => {
    clearUnread(conversation.id);
  }, [conversation.id, clearUnread]);

  // Auto-scroll to bottom on new messages if near bottom
  useEffect(() => {
    if (wasNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const prevHeight = scrollRef.current?.scrollHeight ?? 0;
    const oldest = messages[0]?.created_at;
    if (!oldest) {
      setLoadingOlder(false);
      return;
    }
    const older = await loadOlderMessages(conversation.id, oldest);
    if (older.length > 0) {
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length >= PAGE_SIZE);
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const newHeight = scrollRef.current.scrollHeight;
          scrollRef.current.scrollTop = newHeight - prevHeight;
        }
      });
    } else {
      setHasMore(false);
    }
    setLoadingOlder(false);
  }, [conversation.id, loadingOlder, hasMore, messages]);

  // Track scroll position and load older
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    wasNearBottom.current = nearBottom;
    if (el.scrollTop < 50 && hasMore && !loadingOlder) {
      loadOlder();
    }
  }, [hasMore, loadingOlder, loadOlder]);

  // Send message (optimistic)
  const handleSend = useCallback(
    async (body: string) => {
      const id = crypto.randomUUID();
      const optimistic: ClientMessage = {
        id,
        conversation_id: conversation.id,
        sender_id: currentUserId,
        body,
        created_at: new Date().toISOString(),
        read_at: null,
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      wasNearBottom.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });

      const res = await sendMessage({
        id,
        conversationId: conversation.id,
        body,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: res.ok ? "sent" : "failed" } : m,
        ),
      );
      if (res.ok) {
        bumpConversation(
          conversation.id,
          body.slice(0, 100),
          new Date().toISOString(),
        );
      }
    },
    [conversation.id, currentUserId, bumpConversation],
  );

  // Retry failed message
  const handleRetry = useCallback(
    async (msgId: string) => {
      const msg = messages.find((m) => m.id === msgId);
      if (!msg) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: "sending" } : m)),
      );
      const res = await sendMessage({
        id: msgId,
        conversationId: conversation.id,
        body: msg.body,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, status: res.ok ? "sent" : "failed" } : m,
        ),
      );
      if (res.ok) {
        bumpConversation(
          conversation.id,
          msg.body.slice(0, 100),
          new Date().toISOString(),
        );
      }
    },
    [messages, conversation.id, bumpConversation],
  );

  // Render messages with day dividers and grouping
  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let lastDay: string | null = null;
    let lastSender: string | null = null;
    let lastTime: string | null = null;

    messages.forEach((msg) => {
      const dayKey = msg.created_at.slice(0, 10);
      if (dayKey !== lastDay) {
        items.push(
          <DayDivider
            key={`day-${dayKey}`}
            label={formatDayLabel(msg.created_at)}
          />,
        );
        lastDay = dayKey;
        lastSender = null;
      }

      const isMine = msg.sender_id === currentUserId;
      const grouped =
        lastSender === msg.sender_id &&
        lastTime !== null &&
        isWithin5Min(msg.created_at, lastTime);

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={isMine}
          recipientOnline={otherOnline}
          status={msg.status}
          grouped={grouped}
          onRetry={() => handleRetry(msg.id)}
        />,
      );
      lastSender = msg.sender_id;
      lastTime = msg.created_at;
    });

    return items;
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <ThreadHeader
        name={conversation.other_name}
        email={conversation.other_email}
        otherId={conversation.other_id}
        online={otherOnline}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2">
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 size={16} className="animate-spin text-fg-muted" />
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-fg-muted">
              Belum ada pesan. Mulai percakapan.
            </p>
          </div>
        ) : (
          renderMessages()
        )}
        <div ref={bottomRef} />
      </div>
      <Composer onSend={handleSend} />
    </div>
  );
}
