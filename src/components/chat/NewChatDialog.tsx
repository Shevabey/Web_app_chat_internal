"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { searchUsers, startConversation } from "@/app/(app)/chat/actions";
import type { Profile } from "@/types/db";

export function NewChatDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = useCallback((value: string) => setQuery(value), []);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    const timeout = window.setTimeout(async () => {
      try {
        const users = await searchUsers(term);
        if (!cancelled) setResults(users);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Gagal mencari pengguna. Coba lagi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [open, query]);

  const handleStart = useCallback(
    async (otherUserId: string) => {
      setStarting(true);
      setError("");
      const res = await startConversation(otherUserId);
      if (res.ok) {
        router.push(`/chat/${res.data.conversationId}`);
        onClose();
      } else {
        setError(res.error);
      }
      setStarting(false);
    },
    [router, onClose],
  );

  return (
    <Modal open={open} onClose={onClose} title="Chat Baru">
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari nama atau email…"
            autoFocus
            className="w-full h-10 rounded-full border border-border bg-bg pl-10 pr-4 text-sm text-fg placeholder:text-fg-muted focus:border-fg focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-fg-muted">{error}</p>}

        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-fg-muted" />
            </div>
          )}
          {!loading && !error && query.trim() && results.length === 0 && (
            <p className="text-sm text-fg-muted text-center py-4">
              Tidak ada pengguna ditemukan.
            </p>
          )}
          {!loading &&
            results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStart(user.id)}
                disabled={starting}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors text-left">
                <Avatar name={user.display_name} id={user.id} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">
                    {user.display_name}
                  </p>
                  <p className="text-xs text-fg-muted truncate">{user.email}</p>
                </div>
                <UserPlus size={18} className="text-fg-muted shrink-0" />
              </button>
            ))}
        </div>
      </div>
    </Modal>
  );
}
