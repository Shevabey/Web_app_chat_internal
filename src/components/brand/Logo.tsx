'use client';

import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/brand/logo-black.svg"
        alt="Akselera.Tech"
        width={140}
        height={28}
        className="h-7 w-auto dark:hidden"
        priority
      />
      <Image
        src="/brand/logo-white.svg"
        alt="Akselera.Tech"
        width={140}
        height={28}
        className="h-7 w-auto hidden dark:block"
        priority
      />
    </div>
  );
}
