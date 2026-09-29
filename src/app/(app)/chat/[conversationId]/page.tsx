import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { MessageThread } from "@/components/chat/MessageThread";
import type { ConversationItem, Message } from "@/types/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const { supabase, user } = await requireUser();

  // Fetch conversation list and messages in parallel
  const [convResult, msgResult] = await Promise.all([
    supabase.rpc("list_my_conversations"),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1),
  ]);

  const conversations = (convResult.data ?? []) as ConversationItem[];
  const conversation = conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    notFound();
  }

  const rawMessages = (msgResult.data ?? []) as Message[];
  const hasMore = rawMessages.length > PAGE_SIZE;
  const messages = (
    hasMore ? rawMessages.slice(0, PAGE_SIZE) : rawMessages
  ).reverse();

  // Mark as read (fire-and-forget)
  supabase.rpc("mark_conversation_read", { conv: conversationId }).then(() => {
    // Also refresh conversations to clear unread badge
  });

  return (
    <MessageThread
      initialMessages={messages}
      conversation={conversation}
      currentUserId={user.id}
      hasMore={hasMore}
    />
  );
}
