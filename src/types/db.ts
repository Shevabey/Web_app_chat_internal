export type Profile = {
  id: string;
  email: string;
  display_name: string;
};

export type ConversationItem = {
  id: string;
  other_id: string;
  other_name: string;
  other_email: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ClientMessage = Message & {
  status?: 'sending' | 'sent' | 'failed';
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
