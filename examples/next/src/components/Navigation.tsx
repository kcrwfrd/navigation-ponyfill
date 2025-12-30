'use client'

import { useNavigation } from '@/context/NavigationContext'

export function Navigation() {
  const { canGoBack, previousPath, ready } = useNavigation()

  return (
    <div className="flex gap-1 text-sm text-zinc-500 dark:text-zinc-400">
      {ready && <span>canGoBack: {canGoBack ? 'true' : 'false'}</span>}
      {ready && previousPath && <span>|</span>}
      {previousPath && <span>prev: {previousPath}</span>}
    </div>
  )
}
