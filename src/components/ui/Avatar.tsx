import { getInitials } from '@/lib/format/time';
import { PresenceDot } from '@/components/ui/PresenceDot';

export function Avatar({
  name,
  id,
  online,
  size = 'md',
}: {
  name: string;
  id: string;
  online?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  return (
    <div className="relative shrink-0">
      <div
        className={`rounded-full flex items-center justify-center font-semibold text-fg bg-surface ${sizeClass}`}
      >
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <PresenceDot online={online} />
      )}
    </div>
  );
}
