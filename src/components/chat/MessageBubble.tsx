'use client';

import { Check, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';
import { formatClock } from '@/lib/format/time';
import type { ClientMessage } from '@/types/db';

type MessageBubbleProps = {
  message: ClientMessage;
  isMine: boolean;
  status?: 'sending' | 'sent' | 'failed';
  senderName: string;
  grouped: boolean;
  onRetry: () => void;
};

export function MessageBubble({
  message,
  isMine,
  status,
  grouped,
  onRetry,
}: MessageBubbleProps) {
  const time = formatClock(message.created_at);

  return (
    <div
      className={`flex animate-slide-in ${isMine ? 'justify-end' : 'justify-start'} ${
        grouped ? 'mt-0.5' : 'mt-2'
      }`}
    >
      <div
        className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 text-sm ${
          isMine
            ? 'bg-accent-bg text-accent-fg rounded-br-md'
            : 'bg-surface text-fg rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
          {status === 'sending' && <Loader2 size={12} className="animate-spin opacity-60" />}
          {status === 'failed' && (
            <button onClick={onRetry} className="flex items-center gap-0.5 text-xs opacity-70 hover:opacity-100">
              <AlertCircle size={12} />
              <span>Gagal, coba lagi</span>
            </button>
          )}
          {status !== 'sending' && status !== 'failed' && isMine && (
            <>
              <span className="text-[10px] opacity-60">{time}</span>
              {message.read_at ? (
                <CheckCheck size={14} className="opacity-60" />
              ) : (
                <Check size={14} className="opacity-60" />
              )}
            </>
          )}
          {status !== 'sending' && status !== 'failed' && !isMine && (
            <span className="text-[10px] opacity-50">{time}</span>
          )}
        </div>
      </div>
    </div>
  );
}
