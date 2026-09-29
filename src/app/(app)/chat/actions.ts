'use server';

import { requireUser } from '@/lib/auth/requireUser';
import {
  sendMessageSchema,
  startConversationSchema,
  searchUsersSchema,
  loadOlderSchema,
  markReadSchema,
} from '@/lib/validation/chat';
import type { ActionResult, Profile, Message, ConversationItem } from '@/types/db';

export async function searchUsers(query: string): Promise<Profile[]> {
  const { supabase, user } = await requireUser();
  const parsed = searchUsersSchema.safeParse({ query });
  if (!parsed.success) return [];

  const term = parsed.data.query
    .slice(0, 50)
    .replace(/[,()]/g, ' ')
    .replace(/[\\%_]/g, '\\$&');

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .neq('id', user.id)
    .or(`display_name.ilike.%${term}%,email.ilike.%${term}%`)
    .order('display_name')
    .limit(20);

  return (data ?? []) as Profile[];
}

export async function startConversation(
  otherUserId: string
): Promise<ActionResult<{ conversationId: string }>> {
  const { supabase } = await requireUser();
  const parsed = startConversationSchema.safeParse({ otherUserId });
  if (!parsed.success) return { ok: false, error: 'Pengguna tidak valid.' };

  const { data, error } = await supabase.rpc('start_conversation', {
    other_user: parsed.data.otherUserId,
  });

  if (error) return { ok: false, error: 'Gagal memulai chat.' };
  return { ok: true, data: { conversationId: data as string } };
}

export async function sendMessage(
  input: unknown
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pesan tidak valid.' };

  const { id, conversationId, body } = parsed.data;
  const { error } = await supabase
    .from('messages')
    .insert({ id, conversation_id: conversationId, body });

  if (error && error.code !== '23505') {
    console.error('sendMessage failed', error.code);
    return {
      ok: false,
      error: error.code === '54000' ? 'Terlalu cepat, coba lagi sebentar.' : 'Gagal terkirim.',
    };
  }
  return { ok: true, data: undefined };
}

export async function loadOlderMessages(
  conversationId: string,
  before: string
): Promise<Message[]> {
  const { supabase } = await requireUser();
  const parsed = loadOlderSchema.safeParse({ conversationId, before });
  if (!parsed.success) return [];

  const { data } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .eq('conversation_id', parsed.data.conversationId)
    .lt('created_at', parsed.data.before)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];
  return data.reverse() as Message[];
}

export async function markRead(conversationId: string): Promise<void> {
  const { supabase } = await requireUser();
  const parsed = markReadSchema.safeParse({ conversationId });
  if (!parsed.success) return;

  await supabase.rpc('mark_conversation_read', { conv: parsed.data.conversationId });
}

export async function refreshConversations(): Promise<ConversationItem[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc('list_my_conversations');
  return (data ?? []) as ConversationItem[];
}
