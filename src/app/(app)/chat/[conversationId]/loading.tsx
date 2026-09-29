import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="h-16 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}
