'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useNavigation } from '@/context/NavigationContext'

export function BackButton({ fallbackUrl }: { fallbackUrl: string }) {
  const { canGoBack, previousPath } = useNavigation()
  const router = useRouter()

  return (
    <Link
      href={previousPath ?? fallbackUrl}
      onClick={(event) => {
        if (canGoBack) {
          event.preventDefault()
          router.back()
        }
      }}
      className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      aria-label="Go back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </Link>
  )
}
