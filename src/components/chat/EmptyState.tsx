import { MessageSquare } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="hidden md:flex h-full items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={36} className="text-fg-muted" />
        </div>
        <p className="text-fg-muted text-sm">
          Pilih percakapan atau mulai chat baru
        </p>
        <p className="text-fg-muted text-xs mt-1">
          Daftar hanya berisi percakapan milik akun yang login.
        </p>
      </div>
    </div>
  );
}
