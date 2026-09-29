'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

type ComposerProps = {
  onSend: (body: string) => void;
};

export function Composer({ onSend }: ComposerProps) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    if (taRef.current) {
      taRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleInput = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 border-t border-border bg-bg shrink-0"
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Tulis pesan…"
        rows={1}
        className="flex-1 resize-none rounded-2xl border border-border bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-fg focus:outline-none max-h-[120px]"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="w-10 h-10 shrink-0 rounded-full bg-accent-bg text-accent-fg flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity active:scale-[0.95]"
        aria-label="Kirim"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
