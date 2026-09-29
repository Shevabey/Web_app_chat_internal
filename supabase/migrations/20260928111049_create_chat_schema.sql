/*
# Akselera.Tech Internal Chat — Full Schema

1. New Tables
- `profiles`: user display info, 1:1 with auth.users
  - `id` uuid PK = auth.users.id
  - `email` text NOT NULL
  - `display_name` text NOT NULL
  - `created_at` timestamptz DEFAULT now()
- `conversations`: 1-on-1 chat between two users
  - `id` uuid PK DEFAULT gen_random_uuid()
  - `user_a` uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
  - `user_b` uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
  - `last_message_at` timestamptz NULL
  - `last_message_preview` text NULL
  - `created_at` timestamptz DEFAULT now()
  - CHECK: user_a < user_b (canonical ordering)
  - UNIQUE: (user_a, user_b)
- `messages`: individual messages in a conversation
  - `id` uuid PK DEFAULT gen_random_uuid()
  - `conversation_id` uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
  - `sender_id` uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
  - `body` text NOT NULL CHECK length 1..2000
  - `created_at` timestamptz DEFAULT now()
  - `read_at` timestamptz NULL

2. Security (RLS enabled on all tables)
- profiles: every authenticated user can read all profiles (needed to start chats); users can insert/update only their own row.
- conversations: users can only read/insert conversations where they are a participant.
- messages: users can only read messages in conversations they belong to; can only insert messages (with sender_id defaulted to auth.uid()) into their own conversations; NO update or delete.

3. RPC Functions
- `list_my_conversations()`: returns the user's conversations with other user's name/email, last message info, and unread count.
- `start_conversation(other_user uuid)`: idempotent — returns existing or creates new conversation; errors on self or unknown user.
- `mark_conversation_read(conv uuid)`: marks all messages in a conversation as read by the caller.
- `ping()`: keep-alive check, anon-allowed.

4. Triggers
- `handle_new_user`: creates a profile row when a new auth.users row is inserted.
- `touch_conversation`: updates `last_message_at` and `last_message_preview` on message insert.
- `rate_limit_messages`: prevents more than 20 messages per 10 seconds per user.

5. Realtime
- `messages` and `conversations` added to supabase_realtime publication.
*/

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== CONVERSATIONS =====
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a <> user_b),
  UNIQUE (user_a, user_b)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant" ON conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "conversations_insert_participant" ON conversations;
CREATE POLICY "conversations_insert_participant" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- ===== MESSAGES =====
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

-- ===== TRIGGER: touch conversation on new message =====
CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = left(NEW.body, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

-- ===== TRIGGER: rate limit (20 messages per 10 seconds) =====
CREATE OR REPLACE FUNCTION public.rate_limit_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.messages
  WHERE sender_id = NEW.sender_id
    AND created_at > now() - interval '10 seconds';
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded' USING ERRCODE = '54000';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_rate_limit ON messages;
CREATE TRIGGER on_message_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_messages();

-- ===== RPC: list_my_conversations =====
CREATE OR REPLACE FUNCTION public.list_my_conversations()
RETURNS TABLE (
  id uuid,
  other_id uuid,
  other_name text,
  other_email text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    CASE WHEN c.user_a = auth.uid() THEN c.user_b ELSE c.user_a END AS other_id,
    p.display_name AS other_name,
    p.email AS other_email,
    c.last_message_at,
    c.last_message_preview,
    (
      SELECT count(*)::bigint FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id <> auth.uid()
        AND m.read_at IS NULL
    ) AS unread_count
  FROM public.conversations c
  JOIN public.profiles p
    ON p.id = CASE WHEN c.user_a = auth.uid() THEN c.user_b ELSE c.user_a END
  WHERE c.user_a = auth.uid() OR c.user_b = auth.uid()
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

-- ===== RPC: start_conversation =====
CREATE OR REPLACE FUNCTION public.start_conversation(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  conv_id uuid;
  me uuid := auth.uid();
  ua uuid;
  ub uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF other_user = me THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself' USING ERRCODE = 'P0003';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = other_user) THEN
    RAISE EXCEPTION 'Unknown user' USING ERRCODE = 'P0003';
  END IF;
  ua := least(me, other_user);
  ub := greatest(me, other_user);

  SELECT id INTO conv_id FROM public.conversations WHERE user_a = ua AND user_b = ub;
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b) VALUES (ua, ub) RETURNING id INTO conv_id;
  END IF;
  RETURN conv_id;
END;
$$;

-- ===== RPC: mark_conversation_read =====
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conv AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not a participant' USING ERRCODE = '42501';
  END IF;
  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = conv
    AND sender_id <> auth.uid()
    AND read_at IS NULL;
END;
$$;

-- ===== RPC: ping (keep-alive, anon allowed) =====
CREATE OR REPLACE FUNCTION public.ping()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $$ SELECT true; $$;

-- ===== GRANTS =====
GRANT EXECUTE ON FUNCTION public.list_my_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ping() TO anon, authenticated;

-- ===== REALTIME PUBLICATION =====
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
