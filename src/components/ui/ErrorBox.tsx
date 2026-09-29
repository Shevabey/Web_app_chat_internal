import { AlertCircle } from 'lucide-react';

export function ErrorBox({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-border px-4 py-3 text-sm text-fg"
      role="alert"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 font-bold text-fg hover:underline"
        >
          Coba lagi
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-fg-muted hover:text-fg"
        >
          ✕
        </button>
      )}
    </div>
  );
}
