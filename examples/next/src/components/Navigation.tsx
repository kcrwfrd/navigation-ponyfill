'use client'

import { useNavigation } from '@/context/NavigationContext'

export function Navigation() {
  const { previousPath } = useNavigation()

  return (
    <div className="flex gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      {previousPath && <span>prev: {previousPath}</span>}
    </div>
  )
}
