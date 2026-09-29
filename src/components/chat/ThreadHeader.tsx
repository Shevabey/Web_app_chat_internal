'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export function ThreadHeader({
  name,
  email,
  otherId,
  online,
}: {
  name: string;
  email: string;
  otherId: string;
  online: boolean;
}) {
  return (
    <div className="h-16 flex items-center gap-3 px-4 border-b border-border shrink-0">
      <Link href="/chat" className="md:hidden p-2 -ml-2 text-fg hover:bg-surface rounded-lg">
        <ArrowLeft size={20} />
      </Link>
      <Avatar name={name} id={otherId} size="sm" online={online} />
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-fg truncate">{name}</h2>
        <p className="text-xs text-fg-muted truncate">
          {online ? (
            <span>● Online</span>
          ) : (
            <span>{email}</span>
          )}
        </p>
      </div>
    </div>
  );
}
