"use client";

import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo/Akselera%20Tech%20dark%20logo.png"
        alt="Akselera.Tech"
        width={180}
        height={40}
        className="h-20 w-auto object-contain dark:hidden"
        priority
      />
      <Image
        src="/logo/Akselera%20Tech%20white%20logo.png"
        alt="Akselera.Tech"
        width={180}
        height={40}
        className="hidden h-20 w-auto object-contain dark:block"
        priority
      />
    </div>
  );
}
