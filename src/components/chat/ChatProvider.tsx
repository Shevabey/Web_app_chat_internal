'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ConversationItem, Message } from '@/types/db';

type ChatState = {
  conversations: ConversationItem[];
  onlineUsers: Set<string>;
  loaded: boolean;
};

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; conversations: ConversationItem[] }
  | { type: 'BUMP_CONVERSATION'; conversationId: string; preview: string; at: string }
  | { type: 'CLEAR_UNREAD'; conversationId: string }
  | { type: 'INCREMENT_UNREAD'; conversationId: string }
  | { type: 'SET_ONLINE'; users: Set<string> }
  | { type: 'SET_LOADED'; loaded: boolean };

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.conversations, loaded: true };
    case 'BUMP_CONVERSATION': {
      const updated = state.conversations.map((c) =>
        c.id === action.conversationId
          ? { ...c, last_message_at: action.at, last_message_preview: action.preview }
          : c
      );
      // Move to top
      updated.sort((a, b) =>
        (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '')
      );
      return { ...state, conversations: updated };
    }
    case 'CLEAR_UNREAD':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId ? { ...c, unread_count: 0 } : c
        ),
      };
    case 'INCREMENT_UNREAD':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? { ...c, unread_count: c.unread_count + 1 }
            : c
        ),
      };
    case 'SET_ONLINE':
      return { ...state, onlineUsers: action.users };
    case 'SET_LOADED':
      return { ...state, loaded: action.loaded };
    default:
      return state;
  }
}

type ChatContextValue = {
  conversations: ConversationItem[];
  onlineUsers: Set<string>;
  loaded: boolean;
  refreshConversations: () => Promise<void>;
  bumpConversation: (id: string, preview: string, at: string) => void;
  clearUnread: (id: string) => void;
  incrementUnread: (id: string) => void;
  subscribeToMessages: (conversationId: string, cb: (msg: Message) => void) => () => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({
  children,
  initialConversations,
  userId,
}: {
  children: ReactNode;
  initialConversations: ConversationItem[];
  userId: string;
}) {
  const [state, dispatch] = useReducer(reducer, {
    conversations: initialConversations,
    onlineUsers: new Set<string>(),
    loaded: true,
  });
  const messageListeners = useRef<Map<string, ((msg: Message) => void)[]>>(new Map());
  const supabaseRef = useRef(createClient());

  const refreshConversations = useCallback(async () => {
    const { data } = await supabaseRef.current.rpc('list_my_conversations');
    if (data) dispatch({ type: 'SET_CONVERSATIONS', conversations: data as ConversationItem[] });
  }, []);

  const bumpConversation = useCallback((id: string, preview: string, at: string) => {
    dispatch({ type: 'BUMP_CONVERSATION', conversationId: id, preview, at });
  }, []);

  const clearUnread = useCallback((id: string) => {
    dispatch({ type: 'CLEAR_UNREAD', conversationId: id });
  }, []);

  const incrementUnread = useCallback((id: string) => {
    dispatch({ type: 'INCREMENT_UNREAD', conversationId: id });
  }, []);

  const subscribeToMessages = useCallback((conversationId: string, cb: (msg: Message) => void) => {
    const listeners = messageListeners.current.get(conversationId) ?? [];
    listeners.push(cb);
    messageListeners.current.set(conversationId, listeners);
    return () => {
      const current = messageListeners.current.get(conversationId) ?? [];
      messageListeners.current.set(
        conversationId,
        current.filter((l) => l !== cb)
      );
    };
  }, []);

  // Realtime: one channel for messages + conversations
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`chat:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          const listeners = messageListeners.current.get(msg.conversation_id) ?? [];
          listeners.forEach((l) => l(msg));
          // Bump conversation preview
          dispatch({
            type: 'BUMP_CONVERSATION',
            conversationId: msg.conversation_id,
            preview: msg.body.slice(0, 100),
            at: msg.created_at,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => refreshConversations()
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refreshConversations();
      });

    // Presence
    const presence = supabase.channel('presence:online', {
      config: { presence: { key: userId } },
    });

    presence
      .on('presence', { event: 'sync' }, () => {
        const online = new Set(Object.keys(presence.presenceState()));
        dispatch({ type: 'SET_ONLINE', users: online });
      })
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') {
          await presence.track({ t: 1 });
        }
      });

    // Resync on reconnect / focus
    const onOnline = () => refreshConversations();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshConversations();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presence);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, refreshConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations: state.conversations,
        onlineUsers: state.onlineUsers,
        loaded: state.loaded,
        refreshConversations,
        bumpConversation,
        clearUnread,
        incrementUnread,
        subscribeToMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
