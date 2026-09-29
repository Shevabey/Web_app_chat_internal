'use client';

import { useTransition } from 'react';
import { signOutAction } from '@/app/(auth)/actions';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/types/db';

export function AppHeader({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
      <Logo />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-fg hidden sm:block">
            {profile.display_name}
          </span>
          <Avatar name={profile.display_name} id={profile.id} size="sm" />
        </div>
        <form action={() => startTransition(() => signOutAction())}>
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold text-fg-muted hover:text-fg transition-colors"
          >
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
