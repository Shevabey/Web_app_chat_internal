export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-md bg-surface ${className}`} />;
}
