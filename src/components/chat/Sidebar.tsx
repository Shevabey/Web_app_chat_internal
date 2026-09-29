"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, MessageSquare } from "lucide-react";
import { useChat } from "@/components/chat/ChatProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatListTime } from "@/lib/format/time";
import type { ConversationItem } from "@/types/db";

export function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const { conversations, onlineUsers } = useChat();
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.other_name.toLowerCase().includes(q) ||
        (c.last_message_preview ?? "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  return (
    <div className="flex h-full flex-col bg-panel border-r border-border">
      {/* Search + New Chat */}
      <div className="p-3 space-y-2 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent-bg text-accent-fg px-4 py-2.5 text-sm font-semibold shadow-soft hover:opacity-90 transition-opacity active:scale-[0.98]">
          <Plus size={16} />
          Chat baru
        </button>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari chat"
            className="w-full h-10 rounded-full border border-border bg-bg pl-10 pr-4 text-sm text-fg placeholder:text-fg-muted focus:border-fg focus:outline-none"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-fg-muted" />
            </div>
            <p className="text-sm text-fg-muted">
              {search.trim()
                ? "Tidak ada percakapan yang cocok."
                : "Belum ada percakapan"}
            </p>
            {!search.trim() && (
              <p className="text-xs text-fg-muted mt-1">
                Klik + Chat baru untuk memulai
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={pathname === `/chat/${conv.id}`}
                online={onlineUsers.has(conv.other_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  active,
  online,
}: {
  conv: ConversationItem;
  active: boolean;
  online: boolean;
}) {
  return (
    <Link
      href={`/chat/${conv.id}`}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
        active ? "bg-surface" : "hover:bg-surface/60"
      }`}>
      <Avatar name={conv.other_name} id={conv.other_id} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-fg truncate">
            {conv.other_name}
          </span>
          {conv.last_message_at && (
            <span className="text-xs text-fg-muted shrink-0">
              {formatListTime(conv.last_message_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-[13px] text-fg-muted truncate">
            {conv.last_message_preview ?? "Belum ada pesan"}
          </span>
          {conv.unread_count > 0 && <Badge count={conv.unread_count} />}
        </div>
      </div>
    </Link>
  );
}
