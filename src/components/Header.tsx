"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "./BackButton";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-lg mx-auto px-4 py-4">
        {isHome ? (
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Feed
          </h1>
        ) : (
          <BackButton />
        )}
      </div>
    </header>
  );
}
