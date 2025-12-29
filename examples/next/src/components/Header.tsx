'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BackButton } from './BackButton'
import { Navigation } from './Navigation'

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <nav className="max-w-lg mx-auto px-4 py-2">
        <ul className="flex flex-row-reverse items-center justify-between gap-3 min-h-9">
          <li>
            <Link
              href="/"
              className={`text-sm uppercase font-bold transition-colors pb-1 pt-4 border-b-3 ${
                isHome
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-transparent hover:border-b-zinc-900 dark:hover:border-b-zinc-100'
              }`}
            >
              Home
            </Link>
          </li>
          <li className="w-full">
            <Navigation />
          </li>
          <li className="w-9 shrink-0">
            {!isHome && <BackButton fallbackUrl="/" />}
          </li>
        </ul>
      </nav>
    </header>
  )
}
