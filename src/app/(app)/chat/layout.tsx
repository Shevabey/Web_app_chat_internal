import { requireUser } from '@/lib/auth/requireUser';
import { ChatShell } from '@/components/chat/ChatShell';
import type { ConversationItem } from '@/types/db';

export const dynamic = 'force-dynamic';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, profile } = await requireUser();

  const { data } = await supabase.rpc('list_my_conversations');
  const conversations = (data ?? []) as ConversationItem[];

  return (
    <ChatShell
      initialConversations={conversations}
      userId={user.id}
      profile={profile}
    >
      {children}
    </ChatShell>
  );
}
